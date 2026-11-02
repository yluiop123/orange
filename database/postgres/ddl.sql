-- public.sys_group definition

-- Drop table

-- DROP TABLE public.sys_group;

CREATE TABLE public.sys_group (
	id varchar NOT NULL, -- 组织id
	"name" varchar NULL, -- 组织名
	status varchar NOT NULL DEFAULT '1', -- 状态
	create_time timestamptz DEFAULT now() NULL, -- 创建时间
	parent_id varchar NULL, -- 父组织id
	update_time timestamptz DEFAULT now() NULL, -- 更新时间
	created_by varchar NULL, -- 创建人
	updated_by varchar NULL, -- 更新人
	version int4 DEFAULT 0 NOT NULL, -- 乐观锁版本
	CONSTRAINT sys_group_pkey PRIMARY KEY (id),
	CONSTRAINT ck_sys_group_status CHECK (status IS NULL OR status IN ('0', '1')),
	CONSTRAINT ck_sys_group_code CHECK (
		id ~ '^[0-9]+$'
		AND (
			(parent_id IS NULL AND length(id) = 2)
			OR (parent_id IS NOT NULL AND length(id) = length(parent_id) + 2 AND left(id, length(parent_id)) = parent_id)
		)
	),
	CONSTRAINT fk_sys_group_parent FOREIGN KEY (parent_id) REFERENCES public.sys_group(id) ON DELETE RESTRICT
);
CREATE INDEX idx_sys_group_parent ON public.sys_group(parent_id, id);
COMMENT ON TABLE public.sys_group IS '组织机构表';

-- Column comments

COMMENT ON COLUMN public.sys_group.id IS '组织id';
COMMENT ON COLUMN public.sys_group."name" IS '组织名';
COMMENT ON COLUMN public.sys_group.status IS '状态';
COMMENT ON COLUMN public.sys_group.create_time IS '创建时间';
COMMENT ON COLUMN public.sys_group.parent_id IS '父组织id';
COMMENT ON COLUMN public.sys_group.update_time IS '更新时间';


-- public.sys_permission definition

-- Drop table

-- DROP TABLE public.sys_permission;

CREATE TABLE public.sys_permission (
	id varchar NOT NULL, -- 权限id
	"name" varchar NULL, -- 权限名
	"path" varchar NULL, -- 权限路径
	"action" varchar NULL, -- 权限动作
	"type" varchar NULL, -- 权限类型
	status varchar NOT NULL DEFAULT '1', -- 权限状态
	parent_id varchar NULL, -- 父权限id
	create_time timestamptz DEFAULT now() NULL, -- 创建时间
	update_time timestamptz DEFAULT now() NULL, -- 更新时间
	created_by varchar NULL, -- 创建人
	updated_by varchar NULL, -- 更新人
	version int4 DEFAULT 0 NOT NULL, -- 乐观锁版本
	CONSTRAINT sys_permission_pkey PRIMARY KEY (id),
	CONSTRAINT ck_sys_permission_status CHECK (status IS NULL OR status IN ('0', '1')),
	CONSTRAINT ck_sys_permission_type CHECK (type IS NULL OR type IN ('menu', 'action', 'directory')),
	CONSTRAINT ck_sys_permission_code CHECK (
		id ~ '^[0-9]+$'
		AND (
			(parent_id IS NULL AND length(id) = 4)
			OR (parent_id IS NOT NULL AND length(id) = length(parent_id) + 2 AND left(id, length(parent_id)) = parent_id)
		)
	),
	CONSTRAINT fk_sys_permission_parent FOREIGN KEY (parent_id) REFERENCES public.sys_permission(id) ON DELETE RESTRICT
);
CREATE INDEX idx_sys_permission_parent ON public.sys_permission(parent_id, id);
COMMENT ON TABLE public.sys_permission IS '权限表';

-- Column comments

COMMENT ON COLUMN public.sys_permission.id IS '权限id';
COMMENT ON COLUMN public.sys_permission."name" IS '权限名';
COMMENT ON COLUMN public.sys_permission."path" IS '权限路径';
COMMENT ON COLUMN public.sys_permission."action" IS '权限动作';
COMMENT ON COLUMN public.sys_permission."type" IS '权限类型';
COMMENT ON COLUMN public.sys_permission.status IS '权限状态';
COMMENT ON COLUMN public.sys_permission.parent_id IS '父权限id';
COMMENT ON COLUMN public.sys_permission.create_time IS '创建时间';
COMMENT ON COLUMN public.sys_permission.update_time IS '更新时间';


-- public.sys_role definition

-- Drop table

-- DROP TABLE public.sys_role;

CREATE TABLE public.sys_role (
	id varchar NOT NULL, -- 角色id
	"name" varchar NULL, -- 角色名
	status varchar NOT NULL DEFAULT '1', -- 角色状态
	create_time timestamptz DEFAULT now() NULL, -- 创建时间
	update_time timestamptz DEFAULT now() NULL, -- 更新时间
	created_by varchar NULL, -- 创建人
	updated_by varchar NULL, -- 更新人
	version int4 DEFAULT 0 NOT NULL, -- 乐观锁版本
	CONSTRAINT sys_role_pkey PRIMARY KEY (id),
	CONSTRAINT ck_sys_role_status CHECK (status IS NULL OR status IN ('0', '1'))
);
COMMENT ON TABLE public.sys_role IS '角色表';

-- Column comments

COMMENT ON COLUMN public.sys_role.id IS '角色id';
COMMENT ON COLUMN public.sys_role."name" IS '角色名';
COMMENT ON COLUMN public.sys_role.status IS '角色状态';
COMMENT ON COLUMN public.sys_role.create_time IS '创建时间';
COMMENT ON COLUMN public.sys_role.update_time IS '更新时间';


-- public.sys_role_permission definition

-- Drop table

-- DROP TABLE public.sys_role_permission;

CREATE TABLE public.sys_role_permission (
	role_id varchar NOT NULL, -- 角色id
	permission_id varchar NOT NULL, -- 权限id
	CONSTRAINT sys_role_permission_pkey PRIMARY KEY (role_id, permission_id),
	CONSTRAINT fk_sys_role_permission_role FOREIGN KEY (role_id) REFERENCES public.sys_role(id) ON DELETE CASCADE,
	CONSTRAINT fk_sys_role_permission_permission FOREIGN KEY (permission_id) REFERENCES public.sys_permission(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.sys_role_permission IS '角色-权限关系表';

-- Column comments

COMMENT ON COLUMN public.sys_role_permission.role_id IS '角色id';
COMMENT ON COLUMN public.sys_role_permission.permission_id IS '权限id';


-- public.sys_user definition

-- Drop table

-- DROP TABLE public.sys_user;

CREATE TABLE public.sys_user (
	id varchar(255) NOT NULL, -- 用户id
	"name" varchar(255) NULL, -- 用户姓名
	username varchar(255) NOT NULL, -- 用户名
	email varchar(255) NULL, -- 用户邮箱
	group_id varchar NULL, -- 用户组织id
	phone varchar(255) NULL, -- 用户电话
	status varchar(255) NOT NULL DEFAULT '1', -- 用户状态
	token_version int4 DEFAULT 0 NOT NULL, -- 令牌版本，递增后旧 token 失效
	must_change_password bool DEFAULT false NOT NULL, -- 是否需要强制修改密码
	version int4 DEFAULT 0 NOT NULL, -- 乐观锁版本
	create_time timestamptz DEFAULT now() NULL, -- 创建时间
	update_time timestamptz DEFAULT now() NULL, -- 更新时间
	created_by varchar NULL, -- 创建人
	updated_by varchar NULL, -- 更新人
	"password" varchar NULL, -- 用户密码
	CONSTRAINT sys_user_pkey PRIMARY KEY (id),
	CONSTRAINT unique_username UNIQUE (username),
	CONSTRAINT ck_sys_user_status CHECK (status IS NULL OR status IN ('0', '1')),
	CONSTRAINT fk_sys_user_group FOREIGN KEY (group_id) REFERENCES public.sys_group(id)
);
CREATE INDEX idx_sys_user_group ON public.sys_user(group_id);
COMMENT ON TABLE public.sys_user IS '用户表';

-- Column comments

COMMENT ON COLUMN public.sys_user.id IS '用户id';
COMMENT ON COLUMN public.sys_user."name" IS '用户姓名';
COMMENT ON COLUMN public.sys_user.username IS '用户名';
COMMENT ON COLUMN public.sys_user.email IS '用户邮箱';
COMMENT ON COLUMN public.sys_user.group_id IS '用户组织id';
COMMENT ON COLUMN public.sys_user.phone IS '用户电话';
COMMENT ON COLUMN public.sys_user.status IS '用户状态';
COMMENT ON COLUMN public.sys_user.token_version IS '令牌版本，递增后旧 token 失效';
COMMENT ON COLUMN public.sys_user.create_time IS '创建时间';
COMMENT ON COLUMN public.sys_user.update_time IS '更新时间';
COMMENT ON COLUMN public.sys_user."password" IS '用户密码';


-- public.sys_user_permission definition

-- Drop table

-- DROP TABLE public.sys_user_permission;

CREATE TABLE public.sys_user_permission (
	user_id varchar NOT NULL, -- 用户id
	permission_id varchar NOT NULL, -- 权限id
	CONSTRAINT sys_user_permission_pkey PRIMARY KEY (user_id, permission_id),
	CONSTRAINT fk_sys_user_permission_user FOREIGN KEY (user_id) REFERENCES public.sys_user(id) ON DELETE CASCADE,
	CONSTRAINT fk_sys_user_permission_permission FOREIGN KEY (permission_id) REFERENCES public.sys_permission(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.sys_user_permission IS '用户-权限关系表';

-- Column comments

COMMENT ON COLUMN public.sys_user_permission.user_id IS '用户id';
COMMENT ON COLUMN public.sys_user_permission.permission_id IS '权限id';


-- public.sys_user_role definition

-- Drop table

-- DROP TABLE public.sys_user_role;

CREATE TABLE public.sys_user_role (
	user_id varchar NOT NULL, -- 用户id
	role_id varchar NOT NULL, -- 角色id
	CONSTRAINT sys_user_role_pkey PRIMARY KEY (user_id, role_id),
	CONSTRAINT fk_sys_user_role_user FOREIGN KEY (user_id) REFERENCES public.sys_user(id) ON DELETE CASCADE,
	CONSTRAINT fk_sys_user_role_role FOREIGN KEY (role_id) REFERENCES public.sys_role(id) ON DELETE CASCADE
);

CREATE TABLE public.sys_revoked_token (
	jti varchar NOT NULL, -- token 唯一标识
	token_type varchar NOT NULL, -- access / refresh
	expires_at timestamptz NOT NULL, -- 原 token 过期时间
	create_time timestamptz DEFAULT now() NOT NULL, -- 吊销时间
	CONSTRAINT sys_revoked_token_pkey PRIMARY KEY (jti)
);
CREATE INDEX idx_sys_revoked_token_expires ON public.sys_revoked_token(expires_at);

CREATE TABLE public.sys_login_attempt (
	attempt_key varchar NOT NULL, -- ip:xxx / user:xxx
	failures int4 DEFAULT 0 NOT NULL, -- 窗口内失败次数
	window_start timestamptz NOT NULL, -- 统计窗口开始时间
	locked_until timestamptz NULL, -- 锁定截止时间
	update_time timestamptz DEFAULT now() NOT NULL, -- 更新时间
	CONSTRAINT sys_login_attempt_pkey PRIMARY KEY (attempt_key)
);
CREATE INDEX idx_sys_login_attempt_locked ON public.sys_login_attempt(locked_until);

CREATE TABLE public.sys_operation_log (
	id bigserial NOT NULL,
	trace_id varchar(64) NULL, -- 链路追踪 ID
	username varchar NULL, -- 操作人
	method varchar NOT NULL, -- HTTP 方法
	path varchar NOT NULL, -- 请求路径
	query_string varchar(512) NULL, -- 查询参数
	request_body text NULL, -- 请求体（已脱敏并截断）
	status int4 NOT NULL, -- HTTP 状态
	duration_ms bigint NOT NULL, -- 耗时毫秒
	ip varchar NULL, -- 客户端 IP
	create_time timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT sys_operation_log_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_sys_operation_log_time ON public.sys_operation_log(create_time);
CREATE INDEX idx_sys_operation_log_trace ON public.sys_operation_log(trace_id);
CREATE INDEX idx_sys_operation_log_username ON public.sys_operation_log(username);
COMMENT ON TABLE public.sys_user_role IS '用户-角色关系表';

-- Column comments

COMMENT ON COLUMN public.sys_user_role.user_id IS '用户id';
COMMENT ON COLUMN public.sys_user_role.role_id IS '角色id';