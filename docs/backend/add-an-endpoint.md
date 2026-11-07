# 加一个端点：FastAPI 与 Spring 对照

本页带你在 FastAPI 与 Spring Boot 两套实现里新增 `PUT /api/v1/system/roles/{roleId}/permissions`（替换角色权限），从契约、DTO、校验、错误码、操作日志走到冒烟与契约测试。读者应已能启动其中一套后端，启动命令见 [栈矩阵](../reference/stacks.md)。

## 1. 先把行为定下来

| 项 | 值 |
| --- | --- |
| 方法与路径 | `PUT /api/v1/system/roles/{roleId}/permissions` |
| 授权 Authority | `action#/system/role:edit` |
| 请求体 | `{"permissions":["00050000"]}`；空数组表示清空该角色的权限 |
| 成功 | `code=200`，`message="操作成功"`，`data="操作成功"` |
| 失败 | 40001 请求体不是合法 JSON；40002 权限编码格式不对；40101 未登录；40301 无授权；40401 角色或权限不存在 |

契约先行：先在 `contracts/openapi.json` 登记，再写两套代码。契约当前是 33 个 path、49 个 operation（15 个 deprecated，34 个规范 operation），新增一个 path 就同步加一；改契约的完整流程见 [改契约](../how-to/change-the-contract.md)。

## 2. 同步 contracts/openapi.json

在 `paths` 下新增（字段与现有条目同风格，`tags` 用现有的中文标签）；`contracts/openapi.json` 是人工维护的 OpenAPI 3.1.0 文档，仓库里没有生成或校验它的脚本（`scripts/check-config.mjs` 只校验配置模板），字段要与 DTO 手工对齐。

```json
"/api/v1/system/roles/{roleId}/permissions": {
  "put": {
    "tags": ["角色管理"], "summary": "替换角色权限", "operationId": "setRolePermissions",
    "parameters": [{ "name": "roleId", "in": "path", "required": true, "schema": { "type": "string" } }],
    "requestBody": { "content": { "application/json": { "schema": { "$ref": "#/components/schemas/SetRolePermissionsReq" } } }, "required": true },
    "responses": { "200": { "description": "OK", "content": { "*/*": { "schema": { "$ref": "#/components/schemas/ResponseString" } } } } }
  }
}
```

在 `components.schemas` 下新增：

```json
"SetRolePermissionsReq": {
  "type": "object", "description": "替换角色权限请求参数", "required": ["permissions"],
  "properties": { "permissions": { "type": "array", "items": { "type": "string", "pattern": "^[0-9]{2,}$" } } }
}
```

## 3. FastAPI 实现

### 3.1 DTO 与校验（`app/schemas/role.py`）

```python
import re
from pydantic import Field, field_validator
from app.schemas.common import CamelModel


class SetRolePermissionsIn(CamelModel):
    permissions: list[str]

    @field_validator("permissions")
    @classmethod
    def _permission_codes(cls, values: list[str]) -> list[str]:
        for value in values:
            if not re.fullmatch(r"[0-9]{2,}", value):
                raise ValueError("权限编码只能包含数字")
        return list(dict.fromkeys(values))
```

`CamelModel` 负责 camelCase 别名；校验失败由 `app/errors.py` 的 `RequestValidationError` 处理器转成 40002，`data` 是 `{字段: 消息}`。

### 3.2 service（`app/services/roles.py`）

```python
def set_permissions(
    db: Session, auth: AuthContext, role_id: str, permission_ids: list[str]
) -> None:
    role = get_role(db, role_id)                                   # 角色不存在 → 40401
    GrantGuard(auth).assert_can_assign_permissions(permission_ids) # 越权授予 → 40002
    unique = list(dict.fromkeys(permission_ids))
    permissions = _resolve_permissions(db, unique)
    if len(permissions) != len(unique):
        raise not_found("权限不存在")                               # → 40401
    role.permissions = permissions
    role.updated_by = auth.user.username
    role.update_time = utcnow()
    role.version = (role.version or 0) + 1
    db.commit()
```

`_resolve_permissions` 用 `IN` 查询并按 ID 排序，去重后比较长度，才能发现“列表里有不存在的权限”；宽松的批量查询会静默丢 ID。

### 3.3 路由（`app/routers/roles.py`）

```python
@router.put("/{role_id}/permissions")
def replace_role_permissions(
    role_id: str,
    payload: SetRolePermissionsIn,
    auth: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    require(auth, EDIT)
    roles.set_permissions(db, auth, role_id, payload.permissions)
    return success("操作成功", message="操作成功")
```

- `/{role_id}/permissions` 比 `/{role_id}` 多一段，不会遮蔽详情路由。
- 操作日志由 `OperationLogMiddleware` 统一记录：PUT 且路径以 `/api/v1/system/` 开头即命中，路由里不写日志代码。
- 必须显式传 `message=`；`success("操作成功")` 只设置 `data`，`message` 会是默认的 `"success"`。

## 4. Spring Boot 实现

### 4.1 DTO（`domain/system/role/req/SetRolePermissionsReq.java`）

```java
@Data
public class SetRolePermissionsReq {
    @NotNull(message = "权限列表不能为空")
    private List<@Pattern(regexp = "^[0-9]{2,}$", message = "权限编码只能包含数字") String> permissions;
}
```

`@Valid @RequestBody` 触发校验；失败由 `GlobalExceptionHandler.handleValidationException` 返回 40002，`data` 是 `{字段: 消息}`。

### 4.2 service（`RoleService` + `RoleServiceImpl`）

接口加一行 `Role setPermissions(String roleId, List<String> permissionIds);`，实现：

```java
@Override
@Transactional
public Role setPermissions(String roleId, List<String> permissionIds) {
    Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new BusinessException("角色不存在"));
    grantGuard.assertCanAssignPermissions(permissionIds);
    List<Permission> permissions = permissionRepository.findAllById(permissionIds);
    if (permissions.size() != permissionIds.stream().distinct().count()) {
        throw new BusinessException("权限不存在");
    }
    role.getPermissions().clear();
    role.getPermissions().addAll(permissions);
    return role;
}
```

`BusinessException("...不存在")` 由 `GlobalExceptionHandler.resolveBusinessError` 映射到 40401；`@Transactional` 让清空与重建在一个事务里。

### 4.3 控制器（`controller/system/RoleController.java`）

```java
@PutMapping("/{roleId}/permissions")
@PreAuthorize("hasAuthority('action#/system/role:edit')")
public Response<String> setPermissions(@PathVariable("roleId") String roleId,
                                       @Valid @RequestBody SetRolePermissionsReq req) {
    roleService.setPermissions(roleId, req.getPermissions());
    return Response.ok("操作成功");
}
```

- `@PreAuthorize` 里的 Authority 必须存在于权限目录，否则 `ControllerAuthorityCoverageTest` 失败。
- 操作日志由 `OperationLogInterceptor` 统一记录（注册在 `/api/**`），同样不写日志代码。
- `Response.ok(String)` 会把同一文本同时写入 `message` 与 `data`。

## 5. 验证

1. 单测：`cd backend/python-fastapi && python -m pytest -q`；`cd backend/springboot && mvn -B test`。起服务（数据库先按 [切换数据库](./switch-database.md) 初始化）：FastAPI 用 `python -m app.main`（默认 8000），Spring 用 `mvn spring-boot:run`（默认 8080）。
2. 手工验证（PowerShell；角色与权限 ID 换成库里已有的）：

```powershell
$base = 'http://127.0.0.1:8000/api/v1'   # Spring 改成 8080
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body '{"username":"super","password":"super"}'
$h = @{ Authorization = "Bearer $($login.data.token)" }
Invoke-RestMethod -Method Post -Uri "$base/system/roles" -Headers $h -ContentType 'application/json' -Body '{"id":"qa_doc_role","name":"QA Doc"}'
Invoke-RestMethod -Method Put -Uri "$base/system/roles/qa_doc_role/permissions" -Headers $h -ContentType 'application/json' -Body '{"permissions":["00050000"]}'
```

预期：`code=200`、`message=操作成功`、`data=操作成功`；响应头 `X-Trace-Id` 非空；`GET /api/v1/system/operation-logs` 能看到这条 PUT 及脱敏后的请求体。

3. 冒烟与契约：

```bash
node scripts/ci/http-smoke.mjs http://127.0.0.1:8000/api/v1
node scripts/ci/contract-test.mjs http://127.0.0.1:8000/api/v1
```

两者都以 `0 failed` 结束。注意：`contract-test.mjs` 校验的是固定行为集，不会自动发现新 path；要让新端点进入回归，按现有分节补断言（例如 PUT 后断言 `code=200`，再 GET 角色详情断言 `permissions` 包含该 ID）。

## 6. 另外四套实现

契约是跨栈的。两套示例通过后按同样四层补齐：Go（`internal/http/role_handler.go`、`internal/service/role_service.go`、`internal/store/role_store.go`）、NestJS（`src/roles/roles.controller.ts`、`roles.dto.ts`、`roles.service.ts`）、C#（`Controllers/RoleController.cs`、`Contracts/Requests.cs`、`Services/RoleService.cs`）、Rust（`src/routes/roles.rs`、`src/domain/dto.rs`、`src/service/roles.rs`、`src/repository/roles.rs`）。补完再在 [API 参考](../reference/api.md) 登记端点；否则契约、实现与文档会三处不一致。

## 7. 翻车排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 40002 但 `data` 为空 | 请求体不是合法 JSON，实际是 40001 | 检查引号与逗号；先用最小 body 复现 |
| 40002 且字段名对不上 | 用了 snake_case | FastAPI 的 `CamelModel` 接受 camelCase；Spring 按字段名绑定 |
| 40301 | 账号没有 `action#/system/role:edit`，或权限被禁用 | 用 `super` 登录；检查权限状态 |
| 40401“权限不存在” | 权限编码不在 `sys_permission` | 先创建权限，或改用种子里的编码 |
| Spring 测试报 Authority 不在目录 | `@PreAuthorize` 写了不存在的字符串 | 到 `frontend/react/src/config/permissions.json` 查真实 Authority |
| 操作日志没有记录 | 用了 GET，或路径不在 `/api/v1/system/` | 保持 PUT + `/system/` 前缀 |
| FastAPI 返回 `message="success"` | `success()` 未显式传 `message=` | 写成 `success("操作成功", message="操作成功")` |

> Last verified: 24826bb · 2026-11-07
> 事实来源: contracts/openapi.json、backend/python-fastapi/app/{schemas/role.py,services/roles.py,routers/roles.py,middleware.py,envelope.py,errors.py}、backend/springboot/src/main/java/com/orange/{controller/system/RoleController.java,controller/GlobalExceptionHandler.java,domain/system/role/req/EditRoleReq.java,domain/common/{Response,ErrorCode}.java,service/system/impl/RoleServiceImpl.java,security/auth/GrantGuard.java,config/OperationLogPolicy.java}、scripts/ci/{http-smoke,contract-test}.mjs
