# 校验分层：数据库兜底，服务解释，前端省一次往返

本页解释一条校验规则应该放在哪一层、每层实际负责什么、失败如何变成响应码；改 DTO、约束或错误处理的开发者读这一页。

## 1. 分层判据

分层的依据不是“哪层方便”，而是“这层能对谁保证”。数据库能对所有写入者保证，包括并发请求、种子脚本和手工 SQL；后端能对请求形状和跨表业务做判断，并把失败翻译成可读消息；前端只能做提交前的便利检查，既不能授权也不能保护数据。因此一条必须永远成立的规则会在多层重复：数据库是兜底，后端是友好错误，前端是省一次往返。决策背景见 [ADR 0004](../adr/0004-validation-layering.md)。

## 2. 每层负责什么

| 层 | 位置 | 负责 | 不负责 |
| --- | --- | --- | --- |
| 数据库 | `database/<engine>/ddl.sql` | 主键、外键、唯一性、编码形状、状态/类型枚举、权限身份与 action 形状 | 请求形状、错误文案、跨表业务判断 |
| DTO | `domain/**/req/*.java` 的 Bean Validation 注解 | 单字段非空、长度、正则、枚举；请求体能否绑定 | 跨字段组合、引用是否存在、部分更新语义 |
| 服务 / API | `domain/**/policy/*`、`service/**/impl/*`、controller | 跨字段规则、树结构、引用计数、状态守卫、归一化、错误消息 | HTTP 绑定与字段级文案展示 |
| 前端 | 各页面表单的 zod schema、`lib/tree-code-policy.ts`、`lib/permission-shape.ts` | 即时反馈、提交前拦截 | 数据完整性、授权、并发正确性 |

## 3. 数据库拥有什么

PostgreSQL DDL 里的约束可以直接读出来：组织与权限的编码必须是数字，根节点分别为 2 位和 4 位，子节点必须是父编码加 2 位且 `parent_id` 与编码前缀一致；`status` 只能是 `'0'` 或 `'1'`；权限 `type` 只能是 `menu`、`action`、`directory`；`path` 非空且 `btrim(path) <> ''`；`action` 类型必须有非空 action，`menu`/`directory` 必须没有 action。权限身份的唯一性由两个部分唯一索引保证：有 action 时按 `(type, path, action)`，无 action 时按 `(type, path)`。这些索引是必要的，因为 SQL 里 `NULL` 互不相等，单一 `(type, path, action)` 唯一索引无法约束菜单权限。

数据库刻意不做的部分同样重要：角色编码没有格式约束，`token_type`、`attempt_key` 只有注释，操作日志的 `status`、`duration_ms` 没有范围 CHECK。直连 SQL 可以写入这些值，应用层规则不覆盖导入或修复脚本。哪些约束存在、哪些缺口被接受，见 [数据模型](../reference/data-model.md)。

## 4. DTO 只负责请求形状

DTO 用 Jakarta Validation 注解描述单字段规则，controller 用 `@Valid` 触发；查询对象用 `@Valid @ModelAttribute`。典型边界：

- `LoginReq.username` 必须匹配 `^[A-Za-z0-9_]{4,50}$`，`password` 只要求非空；登录失败不区分“用户不存在”和“密码错误”。
- `ChangePasswordReq.newPassword` 要求 8–64 位且同时含字母和数字；原密码只要求非空。
- `AddUserReq` 对姓名、用户名、邮箱、组织、手机号都要求非空，并给出长度/格式；`EditUserReq` 的字段全部可选，因为编辑是部分更新。
- `StatusReq` 的 `status` 必须匹配 `^(0|1)$`。

DTO 不表达“这个组织是否存在”“这个权限是否会被引用”“新密码是否与原密码相同”。这些需要查库或跨字段比较，放在服务层；DTO 也不表达列表元素是否合法，删除接口的 ID 列表由服务过滤空值后再判断存在性。

## 5. 服务层负责业务规则

服务层是规则的唯一“解释器”，典型职责包括：

- 业务编码：`TreeCodePolicy` 校验非空、纯数字、根长度、子编码 = 父编码 + 2 位。
- 权限形状：`PermissionShapePolicy` 校验 action 与 type 的组合；服务在持久化前把空白 action 归一化为 `NULL`。
- 身份唯一：`assertUniquePermission` 先查重并返回“权限已存在”，避免把原始约束异常抛给用户；并发写入仍由数据库唯一索引兜底。
- 树结构：父节点必须存在、动作权限不能有子节点、禁用父节点前不能有启用后代、删除按最深节点优先。
- 引用与状态守卫：权限被角色或用户引用、组织下有用户时不能删除；角色被用户引用时不能删除；不能禁用/删除当前登录用户；至少保留一个启用的 `super`；只有 `super` 能重置 `super` 密码。
- 部分更新：编辑时用“请求值优先、否则取现值”算出有效 type/path/action，再整体做唯一性与形状校验，避免只改一个字段时绕过规则。

服务层还负责把失败翻译成中文消息。消息是 API 契约的一部分（客户端会展示），但它的具体措辞不是机器可读契约。

## 6. 前端只做预检

前端用 zod 在提交前拦截明显错误，并把后端返回的字段错误映射回表单。它和数据库、后端策略是**三份独立实现**，边界并不总是一致：

| 字段 | 前端 | 后端 / 数据库 | 后果 |
| --- | --- | --- | --- |
| 权限 `path` | `^[a-zA-Z0-9/]{2,}$` | 非空白，编辑最长 200 | 前端更严，带 `-` 或 `_` 的合法路径无法录入 |
| 用户名 | 最少 4 位 | 4–50 且限字符集 | 前端更松，超长或非法字符会先“成功”再被后端拒绝 |
| 角色编码 | `^[a-zA-Z0-9]{2,}$` | `^[A-Za-z0-9_-]{2,32}$`，允许省略 | 前端不支持 `_`、`-` |
| 新密码 | 最少 8 位、两次一致 | 8–64 且同时含字母和数字 | 前端更松 |

这类漂移是已知成本，不是随机 bug：前端规则的目标是“减少无效请求”，不是“复制后端”。当后端返回 `40002` 且 `data` 是字段到消息的映射时，表单用 `applyServerFieldErrors` 把消息落到对应字段；因此后端始终是最终裁决者。

## 7. 错误如何映射到响应码

业务码与 HTTP 状态在 `ErrorCode` 里成对定义：`40001`/400 参数错误、`40002`/400 校验失败、`40101`/401 未登录、`40301`/403 无权限、`40302`/403 需先改密、`40401`/404 不存在、`40501`/405 方法不允许、`40901`/409 冲突、`50000`/500 系统异常。实际映射路径如下：

| 触发点 | 业务码 | HTTP | 响应特征 |
| --- | --- | --- | --- |
| DTO 注解失败（`MethodArgumentNotValidException`） | 40002 | 400 | `data` 是 `{字段: 消息}` 映射 |
| 请求体无法解析、缺参数、参数类型不匹配 | 40001 | 400 | 通用“参数错误” |
| `BusinessException` 消息含“不存在” | 40401 | 404 | 保留业务消息 |
| 消息含“已存在”“已被”“不能删除”“请先禁用子组织” | 40901 | 409 | 保留业务消息 |
| 其他 `BusinessException` | 40002 | 400 | 保留业务消息 |
| 方法级授权失败（`AuthorizationDeniedException`） | 40301 | 403 | “无权限” |
| 未认证或令牌无效 | 40101 | 401 | 入口点统一输出 |
| 强制改密闸门拦截 | 40302 | 403 | “请先修改初始密码” |
| 数据完整性/乐观锁异常 | 40901 | 409 | “数据冲突，请刷新后重试” |
| 登录失败次数超限 | 429 | 429 | 直接返回固定消息 |
| 未捕获异常 | 50000 | 500 | 不暴露内部细节 |

有两个细节值得注意。第一，`BusinessException` 的状态码是按消息子串推断的，这意味着新增消息必须同时检查它是否意外命中“已存在”“已被”等关键词。第二，“请先禁用子组织”在列表里，而权限侧的“请先禁用子权限”不在：禁用仍有启用子节点的组织返回 409，禁用仍有启用子节点的权限返回 40002。这是当前实现的不一致，改动映射表前应先决定是否统一。

数据库约束异常到达客户端在分层设计里被视为 bug：正常写路径都应该先校验并返回业务消息，`40901` 的“数据冲突，请刷新后重试”只是最后一道兜底。并发插入同名权限是例外：预检查会漏，数据库会赢，此时返回冲突是正确行为。

## 8. 改一条规则要动哪些地方

规则的重复是有意的，因此修改边界时必须一起改：数据库 CHECK、后端 policy、前端策略、以及覆盖两层的测试。只改一层会出现“前端允许、后端拒绝”或“后端允许、数据库拒绝”的裂缝。编码、状态、类型、action 形状是当前重复最多的四组规则；具体联动点见 [验证一次改动](../how-to/verify-a-change.md)。

## 9. 现有证据

单元测试覆盖 `TreeCodePolicy`、`TreeIndex`、`EffectivePermissions` 与前端 `tree-code-policy`；集成测试直接写数据库，证明重复身份、空白路径和错误 action 形状会被拒绝；跨栈契约验收检查同样的错误码与响应包体。这些断言与 CI 的对应关系见 [架构](./architecture.md)。

> Last verified: 24826bb · 2026-11-07
> 事实来源: docs/adr/0004-validation-layering.md、database/postgres/ddl.sql、backend/springboot/src/main/java/com/orange/controller/GlobalExceptionHandler.java、backend/springboot/src/main/java/com/orange/domain/common/ErrorCode.java、backend/springboot/src/main/java/com/orange/domain/login/req/LoginReq.java、backend/springboot/src/main/java/com/orange/domain/login/req/ChangePasswordReq.java、backend/springboot/src/main/java/com/orange/domain/system/user/req/AddUserReq.java、backend/springboot/src/main/java/com/orange/service/system/impl/PermissionServiceImpl.java、backend/springboot/src/main/java/com/orange/service/system/impl/UserServiceImpl.java、frontend/react/src/lib/tree-code-policy.ts、frontend/react/src/pages/system/permission/add-child-dialog.tsx、frontend/react/src/lib/form-errors.ts
