> [English](./FEATURES.md) | 简体中文

# 功能特性

这是本仓库中所有技术栈共享的产品范围。新的前端或后端只有在满足下面相同的流程时才算“达到同等能力”，而不是复制 React 代码。

## 1. 产品范围

ORANGE 是一个管理控制台，包含：

1. **认证** — 用户名/密码登录、短时效访问令牌、轮换的 refresh cookie、登出、首次登录强制修改密码、基于数据库的登录锁定。
2. **RBAC** — 用户、角色、组织、权限、直接授权、角色融合、仅 UI 层的角色切换。
3. **系统管理** — 上述四种资源的 CRUD、按业务编码排序的树、操作日志。
4. **演示页面** — 仪表盘、图表、地图、3D 场景、组件展示。它们用于验证外壳和设计系统；不新增后端端点。

## 2. 权限模型

权限是 `type + path + action`：

| 类型 | 含义 | 示例 |
| --- | --- | --- |
| `menu` | 一个页面 | `menu#/system/user` |
| `directory` | 覆盖某个路径下的所有菜单 | `menu#/system`（仅可见性） |
| `action` | 某个页面上的一个操作 | `action#/system/user:add` |

规则：

- 用户的有效权限 = 所有**已启用**角色加直接权限的并集，再减去已禁用的权限。
- 角色切换只是 UI 层的视图筛选。它永远不会减少后端授予的权限。
- 目录权限只控制菜单可见性。它们从不为 API 调用授权。
- 禁用某个权限（`status = 0`）会同时移除其权限和可见性。
- 被禁用的父节点要求其子节点先被禁用；后端会拒绝禁用仍存在已启用后代节点的父节点。

业务编码：

- 组织：根节点 2 位数字，子节点 = 父节点 + 2 位数字。
- 权限：根节点 4 位数字，子节点 = 父节点 + 2 位数字。
- 编码是主键且不可修改。它同时定义同级顺序。
- 删除会留下空档。重新排序需要删除并重建节点，而这同时会丢失其授权。

## 3. 角色

种子角色：

| 角色 | 范围 |
| --- | --- |
| `super` | 全部权限，包括授予 `super` 和重置 `super` 密码 |
| `admin` | 系统管理，但不能授予或重置 `super` |
| `user` | 只读的演示页面 |

约束：

- 只有 `super` 可以分配 `super` 角色。
- 只有当调用者已经拥有某项直接权限时才可授予它。
- 用户不能删除或禁用自己。
- 必须至少保留一个已启用的 `super`。
- 被用户引用的角色不能删除。
- 被角色或用户引用的权限子树不能删除。

## 4. 核心流程

### 4.1 登录

1. `POST /auth/login`。
2. 后端校验密码、账号状态和锁定计数器。
3. 返回访问令牌并设置 HttpOnly refresh cookie。
4. 如果 `must_change_password` 为真，前端打开一个不可关闭的修改密码对话框；在密码修改之前，其他所有 API 都返回 `40302`。
5. 前端加载 `user-info` 和 `menus`，然后重定向到第一个可见的叶子节点。

### 4.2 刷新与登出

- 刷新会轮换令牌并撤销之前的 `jti`。
- 重放 refresh token 会返回 401 并强制重新登录。
- 登出会撤销 refresh token（若存在）并递增 `token_version`，使该用户的所有会话失效；同时清除 cookie。
- 递增 `token_version`（修改密码、管理员重置）会使该用户的所有会话失效。

### 4.3 系统管理

四种资源页面共享相同的生命周期：

1. 筛选（关键词、状态、组织、类型）并做防抖。
2. 拉取数据，筛选条件变化时取消请求。
3. 选择行（组织树和权限树使用树形选择）。
4. 在对话框中新增 / 编辑；服务端字段错误会映射回表单。
5. 切换状态，禁用时弹出确认。
6. 删除时弹出确认；删除后页码会被收敛到有效范围。
7. 每次写入后刷新列表。

具体行为：

- 组织和权限是树。文本筛选会返回祖先节点，因此树保持其层级。
- 组织和权限的编码需手工输入，并在提交前校验。
- 权限类型决定表单形态：`action` 必填一个操作字符串；`menu`/`directory` 禁止填写。
- 创建用户和重置密码会返回 12 位临时密码；UI 在一个可复制的对话框中只展示一次。
- 操作日志是只读的；它支持筛选和无 keyset 的分页。

## 5. 页面清单

### 系统

| 路径 | 用途 |
| --- | --- |
| `/login` | 登录、强制修改密码 |
| `/system/user` | 用户 |
| `/system/role` | 角色与权限授权 |
| `/system/group` | 组织树 |
| `/system/permission` | 权限树 |
| `/system/operation-log` | 审计日志 |
| `/forbidden` | 403 |
| `/not-found` | 404 |

### 仪表盘

`/dashboard/normal`、`/dashboard/network-security`、`/dashboard/military-situational-awareness`、`/dashboard/disaster-command`、`/dashboard/agriculture-forestry`、`/dashboard/industrial`。

### 图表

`/chart/antv`、`/chart/d3`、`/chart/echart`、`/chart/rechart`。

### 地图

`/map/cesium`、`/map/deckgl`、`/map/l7`、`/map/leaflet`、`/map/openlayers`。

### 3D

`/three/three`、`/three/babylon`。

### 组件

`/component/general`、`/component/layout`、`/component/navigation`、`/component/table`、`/component/form`、`/component/display`、`/component/feedback`、`/component/custom`。

每个前端可以使用自己的图表/地图/3D 库。达到同等能力意味着页面存在并演示相同的能力；不要求像素级一致。

## 6. 非功能性要求

- API 前缀为 `/api/v1`；每个响应都使用 [API.md](./API.md) 中的信封结构。
- 每个错误都携带与服务端日志及 `X-Trace-Id` 响应头一致的 `traceId`。
- 页面按需懒加载；当某个演示页面失败时，外壳必须仍然可用。
- UI 支持中文和英文；菜单标题来自数据库，不进行翻译。
- 表格和对话框支持键盘访问；仅有图标的按钮具有可访问名称。
- 破坏性操作需要确认。
- 必须接受空的查询筛选条件，而不是拒绝。
- React 应用是唯一部署到 GitHub Pages 的应用；其他应用只在本地构建和测试，不包含在 Pages 工作流中。
