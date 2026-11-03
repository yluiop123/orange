# Spring Boot 后端项目

[English](./README.md) | 简体中文

## 项目简介

本项目是一个基于 Spring Boot 4.0.2 构建的企业级权限管理系统，采用 JWT 认证和 RBAC（基于角色的访问控制）模型，提供完整的用户、角色、权限和分组管理功能。

接口swagger文档：https://yluiop123.github.io/orange/#/swagger

## 技术栈

- **后端框架**: Spring Boot 4
- **Java版本**: java17+
- **数据库**: PostgreSQL
- **安全框架**: Spring Security + JWT
- **API文档**: SpringDoc OpenAPI 3.0
- **缓存**: Caffeine
- **ORM**: Spring Data JPA
- **构建工具**: Maven
- **开发工具**: Lombok



## 快速开始

### 克隆项目
```bash
git clone <repository-url>
cd backend/springboot
```

### 数据库配置
#### 创建数据库,并执行database 文件夹下的ddl.sql、ddm.sql文件
#### 修改application.yaml文件的数据库连接信息
```sql
-- 配置数据库连接（修改 application.yaml）
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/orange
    username: your_username
    password: your_password
```
### 访问地址

- 应用主页: http://localhost:8080
- API文档: http://localhost:8080/swagger-ui.html
- API接口: http://localhost:8080/api-docs


### 生产环境配置

#### 生成JWT密钥对（生产需要自己生成用自己的密钥对）

```bash
# 生成RSA私钥
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 生成公钥
openssl rsa -pubout -in private_key.pem -out public_key.pem

```
如上生成的密钥对，需要将`private_key.pem`和`public_key.pem`文件放置在服务器自定义目录下。

并且修改application.yaml文件,JWT配置信息中,将`private-key`和`public-key`配置为服务器文件自定义的位置。

```yaml
jwt:
  private-key: classpath:keys/private_key.pem
  public-key: classpath:keys/public_key.pem
```

#### 配置数据库密码
生产环境需要在环境变量中配置数据库密码`DB_PASSWORD`，本地开发取默认值 postgres。
```yaml
    # 数据库密码，从环境变量中获取，本地开发取默认值 postgres
    password: ${DB_PASSWORD:postgres}
```
## 项目结构说明

```
backend/springboot/
├── src/main/java/com/orange/
│   ├── config/                    # 配置类
│   ├── controller/               # 控制器层
│   │   ├── login/               # 登录相关控制器
│   │   └── system/              # 系统管理控制器
│   ├── domain/                   # 数据模型层
│   │   ├── common/              # 通用模型
│   │   ├── login/               # 登录相关模型
│   │   └── system/              # 系统管理模型
│   ├── entity/                   # 实体类
│   ├── repository/               # 数据访问层
│   ├── security/                 # 安全配置
│   ├── service/                  # 业务逻辑层
│   └── OrangeBootApplication.java # 启动类
├── src/main/resources/
│   ├── keys/                     # JWT密钥文件测试环境使用，生产环境请自定义密钥对
│   └── application.yaml          # 应用配置文件
└── pom.xml                       # Maven依赖配置
```
## 数据库设计
### 表关系
    系统的核心逻辑包含：用户 (User)、角色 (Role)、权限 (Permission) 和 组织 (Group)。
    其关联关系如下：
    多对一：用户->组织 (一个用户属于一个组织)。
    多对多：用户<-> 角色 (通过 sys_user_role 关联)。
    多对多：角色<->权限 (通过 sys_role_permission 关联)。
    多对多：用户<->权限 (通过 sys_user_permission 关联，用于授予用户超出其角色的额外权限)。
### 核心表结构
#### 组织机构表 (`sys_group`)
| 字段名 | 类型 | 必填 | 默认值 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| id | varchar | 是 | - | 组织id (主键) |
| name | varchar | 否 | - | 组织名 |
| order_num | int4 | 否 | - | 序号 |
| status | varchar | 否 | - | 状态 |
| parent_id | varchar | 否 | - | 父组织id |
| create_time | timestamp | 否 | now() | 创建时间 |
| update_time | timestamp | 否 | now() | 更新时间 |

#### 用户表 (`sys_user`)
| 字段名 | 类型 | 必填 | 默认值 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| id | varchar(255) | 是 | - | 用户id (主键) |
| username | varchar(255) | 是 | - | 用户名 (唯一) |
| password | varchar | 否 | - | 用户密码 (加密存储) |
| name | varchar(255) | 否 | - | 用户姓名 |
| email | varchar(255) | 否 | - | 用户邮箱 |
| phone | varchar(255) | 否 | - | 用户电话 |
| group_id | varchar | 否 | - | 用户组织id |
| status | varchar(255) | 否 | - | 用户状态 |
| create_time | timestamp | 否 | now() | 创建时间 |
| update_time | timestamp | 否 | now() | 更新时间 |

#### 角色表 (`sys_role`)
| 字段名 | 类型 | 必填 | 默认值 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| id | varchar | 是 | - | 角色id (主键) |
| name | varchar | 否 | - | 角色名 |
| status | varchar | 否 | - | 角色状态 |
| create_time | timestamp | 否 | now() | 创建时间 |
| update_time | timestamp | 否 | now() | 更新时间 |

#### 权限表 (`sys_permission`)
| 字段名 | 类型 | 必填 | 默认值 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| id | varchar | 是 | - | 权限id |
| name | varchar | 否 | - | 权限名 |
| path | varchar | 否 | - | 权限路径 (路由/URL) |
| action | varchar | 否 | - | 权限动作 (GET/POST等) |
| type | varchar | 否 | - | 权限类型 (MENU/BUTTON) |
| status | varchar | 否 | - | 权限状态 |
| parent_id | varchar | 否 | - | 父权限id |
| order_num | int4 | 否 | - | 序号 |
| create_time | timestamp | 否 | now() | 创建时间 |
| update_time | timestamp | 否 | now() | 更新时间 |

---

### 中间关联表
#### 用户-角色表 (`sys_user_role`)
用于记录用户被授予的角色。
- `user_id`: 用户ID
- `role_id`: 角色ID

#### 角色-权限表 (`sys_role_permission`)
用于记录角色包含的资源访问权。
- `role_id`: 角色ID
- `permission_id`: 权限ID

####  用户-权限表 (`sys_user_permission`)
用于针对单一用户直接授予特定权限（覆盖或补充角色权限）。
- `user_id`: 用户ID
- `permission_id`: 权限ID

## 权限控制说明

- **RBAC模型**: 本系统采用 RBAC 模型，用户、角色、权限和分组之间通过关联表进行管理。
- **接口权限配置**: 本项目使用 Spring Security 进行权限控制,可以通过`@PreAuthorize`注解来配置接口权限。
  其中权限规则为：`type#path:action` （action配置`type#path`）或者 `权限编码`。 
  其中 
  `type` 为权限类型（menu/directory/action/function/api），
  `path` 为权限路径（路由/URL），
  `action` 为自定义权限动作（add/delete/edit等）。
  此处的逻辑代码在 `com.orange.security.JwtUserDetailsService.java` 
  的 `getPermissionStrs` 方法中。
```java
    @Operation(summary = "查询用户列表", description = "根据查询条件分页返回用户列表")
    @PostMapping
    @PreAuthorize("hasAuthority('menu#/system/user')") //type#path:action 配置方式
//@PreAuthorize("hasAuthority('000500')")  //权限编码配置方式
    public Response<PageData<UserBean>> queryUsers(@RequestBody QueryUserReq req) {
        PageData<UserBean> pageData = userService.queryUsers(req);
        return Response.ok(pageData);
    }

    @Operation(summary = "删除用户", description = "根据用户ID列表删除用户")
    @DeleteMapping
    @PreAuthorize("hasAuthority('menu#/system/user:delete')")
    public Response<String> deleteUsers(@RequestBody DeleteUserReq req) {
        userService.deleteUsers(req.getIds());
        return Response.ok("删除成功");
    }
```

