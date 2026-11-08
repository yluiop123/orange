-- SQLite port of database/postgres/ddl.sql
-- Same 10 tables, columns, keys, foreign keys, indexes, checks and defaults.
--
-- IMPORTANT: SQLite foreign key enforcement is per-connection and DISABLED by
-- default. The PRAGMA below only applies to the connection that runs this
-- script; every connection that touches the database must execute
--     PRAGMA foreign_keys = ON;
-- before writing (see README.md).
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Dialect notes (Postgres -> SQLite)
--   * No schemas: tables live in `main` with plain names.
--   * varchar(n) -> TEXT; the length intent is kept in the column comment but
--     is not enforced (Postgres rejects values longer than n).
--   * timestamptz -> TEXT storing ISO-8601 UTC; DEFAULT CURRENT_TIMESTAMP.
--   * bigserial   -> INTEGER PRIMARY KEY AUTOINCREMENT (id is INTEGER).
--   * bool        -> INTEGER with CHECK (col IN (0, 1)).
--   * int4/bigint -> INTEGER.
--   * Postgres COMMENT ON is unavailable; comments are kept as `--` lines.
--   * Postgres regex (~) is unavailable; digit checks use NOT GLOB plus
--     length()/substr() so the accepted/rejected set is identical.
-- ---------------------------------------------------------------------------

-- public.sys_group definition

-- Drop table

-- DROP TABLE sys_group;

CREATE TABLE sys_group (
	id TEXT NOT NULL, -- 组织id (varchar)
	"name" TEXT NULL, -- 组织名 (varchar)
	status TEXT NOT NULL DEFAULT '1', -- 状态 (varchar)
	create_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间 (timestamptz -> ISO-8601 UTC)
	parent_id TEXT NULL, -- 父组织id (varchar)
	update_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间 (timestamptz -> ISO-8601 UTC)
	created_by TEXT NULL, -- 创建人 (varchar)
	updated_by TEXT NULL, -- 更新人 (varchar)
	version INTEGER NOT NULL DEFAULT 0, -- 乐观锁版本 (int4)
	CONSTRAINT sys_group_pkey PRIMARY KEY (id),
	CONSTRAINT ck_sys_group_status CHECK (status IN ('0', '1')),
	-- Postgres: id ~ '^[0-9]+$' AND (root has length 2, child is parent + 2 digits)
	CONSTRAINT ck_sys_group_code CHECK (
		id NOT GLOB '*[^0-9]*'
		AND (
			(parent_id IS NULL AND length(id) = 2)
			OR (parent_id IS NOT NULL AND length(id) = length(parent_id) + 2 AND substr(id, 1, length(parent_id)) = parent_id)
		)
	),
	CONSTRAINT fk_sys_group_parent FOREIGN KEY (parent_id) REFERENCES sys_group(id) ON DELETE RESTRICT
);
CREATE INDEX idx_sys_group_parent ON sys_group(parent_id, id);
-- 组织机构表


-- public.sys_permission definition

-- Drop table

-- DROP TABLE sys_permission;

CREATE TABLE sys_permission (
	id TEXT NOT NULL, -- 权限id (varchar)
	"name" TEXT NULL, -- 权限名 (varchar)
	"path" TEXT NOT NULL, -- 权限路径 (varchar)
	"action" TEXT NULL, -- 权限动作；menu/directory 必须为 NULL (varchar)
	"type" TEXT NOT NULL, -- 权限类型 (varchar)
	status TEXT NOT NULL DEFAULT '1', -- 权限状态 (varchar)
	parent_id TEXT NULL, -- 父权限id (varchar)
	create_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间 (timestamptz -> ISO-8601 UTC)
	update_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间 (timestamptz -> ISO-8601 UTC)
	created_by TEXT NULL, -- 创建人 (varchar)
	updated_by TEXT NULL, -- 更新人 (varchar)
	version INTEGER NOT NULL DEFAULT 0, -- 乐观锁版本 (int4)
	CONSTRAINT sys_permission_pkey PRIMARY KEY (id),
	CONSTRAINT ck_sys_permission_status CHECK (status IN ('0', '1')),
	CONSTRAINT ck_sys_permission_type CHECK ("type" IN ('menu', 'action', 'directory')),
	-- Postgres: btrim(path) <> ''
	CONSTRAINT ck_sys_permission_path CHECK (TRIM("path") <> ''),
	CONSTRAINT ck_sys_permission_action_shape CHECK (
		("type" = 'action' AND "action" IS NOT NULL AND TRIM("action") <> '')
		OR ("type" IN ('menu', 'directory') AND "action" IS NULL)
	),
	-- Postgres: id ~ '^[0-9]+$' AND (root has length 4, child is parent + 2 digits)
	CONSTRAINT ck_sys_permission_code CHECK (
		id NOT GLOB '*[^0-9]*'
		AND (
			(parent_id IS NULL AND length(id) = 4)
			OR (parent_id IS NOT NULL AND length(id) = length(parent_id) + 2 AND substr(id, 1, length(parent_id)) = parent_id)
		)
	),
	CONSTRAINT fk_sys_permission_parent FOREIGN KEY (parent_id) REFERENCES sys_permission(id) ON DELETE RESTRICT
);

CREATE TABLE sys_permission_i18n (
	permission_id TEXT NOT NULL,
	locale TEXT NOT NULL,
	"name" TEXT NOT NULL,
	CONSTRAINT sys_permission_i18n_pkey PRIMARY KEY (permission_id, locale),
	CONSTRAINT fk_sys_permission_i18n_permission FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
);
CREATE INDEX idx_sys_permission_parent ON sys_permission(parent_id, id);
-- 权限身份唯一：action 权限按 (type, path, action)，菜单/目录按 (type, path)
-- SQLite supports partial unique indexes, so the semantics match Postgres exactly.
CREATE UNIQUE INDEX uq_sys_permission_identity_action
	ON sys_permission("type", "path", "action") WHERE "action" IS NOT NULL;
CREATE UNIQUE INDEX uq_sys_permission_identity_no_action
	ON sys_permission("type", "path") WHERE "action" IS NULL;
-- 权限表


-- public.sys_role definition

-- Drop table

-- DROP TABLE sys_role;

CREATE TABLE sys_role (
	id TEXT NOT NULL, -- 角色id (varchar)
	"name" TEXT NULL, -- 角色名 (varchar)
	status TEXT NOT NULL DEFAULT '1', -- 角色状态 (varchar)
	create_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间 (timestamptz -> ISO-8601 UTC)
	update_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间 (timestamptz -> ISO-8601 UTC)
	created_by TEXT NULL, -- 创建人 (varchar)
	updated_by TEXT NULL, -- 更新人 (varchar)
	version INTEGER NOT NULL DEFAULT 0, -- 乐观锁版本 (int4)
	CONSTRAINT sys_role_pkey PRIMARY KEY (id),
	CONSTRAINT ck_sys_role_status CHECK (status IN ('0', '1'))
);
-- 角色表


-- public.sys_role_permission definition

-- Drop table

-- DROP TABLE sys_role_permission;

CREATE TABLE sys_role_permission (
	role_id TEXT NOT NULL, -- 角色id (varchar)
	permission_id TEXT NOT NULL, -- 权限id (varchar)
	CONSTRAINT sys_role_permission_pkey PRIMARY KEY (role_id, permission_id),
	CONSTRAINT fk_sys_role_permission_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE,
	CONSTRAINT fk_sys_role_permission_permission FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
);
-- 角色-权限关系表


-- public.sys_user definition

-- Drop table

-- DROP TABLE sys_user;

CREATE TABLE sys_user (
	id TEXT NOT NULL, -- 用户id (varchar(255))
	"name" TEXT NULL, -- 用户姓名 (varchar(255))
	username TEXT NOT NULL, -- 用户名 (varchar(255))
	email TEXT NULL, -- 用户邮箱 (varchar(255))
	group_id TEXT NULL, -- 用户组织id (varchar)
	phone TEXT NULL, -- 用户电话 (varchar(255))
	status TEXT NOT NULL DEFAULT '1', -- 用户状态 (varchar(255))
	token_version INTEGER NOT NULL DEFAULT 0, -- 令牌版本，递增后旧 token 失效 (int4)
	must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)), -- 是否需要强制修改密码 (bool)
	version INTEGER NOT NULL DEFAULT 0, -- 乐观锁版本 (int4)
	create_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 创建时间 (timestamptz -> ISO-8601 UTC)
	update_time TEXT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间 (timestamptz -> ISO-8601 UTC)
	created_by TEXT NULL, -- 创建人 (varchar)
	updated_by TEXT NULL, -- 更新人 (varchar)
	"password" TEXT NULL, -- 用户密码 (varchar)
	CONSTRAINT sys_user_pkey PRIMARY KEY (id),
	CONSTRAINT unique_username UNIQUE (username),
	CONSTRAINT ck_sys_user_status CHECK (status IN ('0', '1')),
	CONSTRAINT fk_sys_user_group FOREIGN KEY (group_id) REFERENCES sys_group(id)
);
CREATE INDEX idx_sys_user_group ON sys_user(group_id);
-- 用户表


-- public.sys_user_permission definition

-- Drop table

-- DROP TABLE sys_user_permission;

CREATE TABLE sys_user_permission (
	user_id TEXT NOT NULL, -- 用户id (varchar)
	permission_id TEXT NOT NULL, -- 权限id (varchar)
	CONSTRAINT sys_user_permission_pkey PRIMARY KEY (user_id, permission_id),
	CONSTRAINT fk_sys_user_permission_user FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
	CONSTRAINT fk_sys_user_permission_permission FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE
);
-- 用户-权限关系表


-- public.sys_user_role definition

-- Drop table

-- DROP TABLE sys_user_role;

CREATE TABLE sys_user_role (
	user_id TEXT NOT NULL, -- 用户id (varchar)
	role_id TEXT NOT NULL, -- 角色id (varchar)
	CONSTRAINT sys_user_role_pkey PRIMARY KEY (user_id, role_id),
	CONSTRAINT fk_sys_user_role_user FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE,
	CONSTRAINT fk_sys_user_role_role FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE
);
-- 用户-角色关系表


-- public.sys_revoked_token definition

CREATE TABLE sys_revoked_token (
	jti TEXT NOT NULL, -- token 唯一标识 (varchar)
	token_type TEXT NOT NULL, -- access / refresh (varchar)
	expires_at TEXT NOT NULL, -- 原 token 过期时间 (timestamptz -> ISO-8601 UTC)
	create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 吊销时间 (timestamptz -> ISO-8601 UTC)
	CONSTRAINT sys_revoked_token_pkey PRIMARY KEY (jti)
);
CREATE INDEX idx_sys_revoked_token_expires ON sys_revoked_token(expires_at);


-- public.sys_login_attempt definition

CREATE TABLE sys_login_attempt (
	attempt_key TEXT NOT NULL, -- ip:xxx / user:xxx (varchar)
	failures INTEGER NOT NULL DEFAULT 0, -- 窗口内失败次数 (int4)
	window_start TEXT NOT NULL, -- 统计窗口开始时间 (timestamptz -> ISO-8601 UTC)
	locked_until TEXT NULL, -- 锁定截止时间 (timestamptz -> ISO-8601 UTC)
	update_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 更新时间 (timestamptz -> ISO-8601 UTC)
	CONSTRAINT sys_login_attempt_pkey PRIMARY KEY (attempt_key)
);
CREATE INDEX idx_sys_login_attempt_locked ON sys_login_attempt(locked_until);


-- public.sys_operation_log definition

CREATE TABLE sys_operation_log (
	-- bigserial: AUTOINCREMENT implies INTEGER PRIMARY KEY, so the Postgres
	-- constraint name sys_operation_log_pkey is folded into the column def.
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	trace_id TEXT NULL, -- 链路追踪 ID (varchar(64))
	username TEXT NULL, -- 操作人 (varchar)
	method TEXT NOT NULL, -- HTTP 方法 (varchar)
	path TEXT NOT NULL, -- 请求路径 (varchar)
	query_string TEXT NULL, -- 查询参数 (varchar(512))
	request_body TEXT NULL, -- 请求体（已脱敏并截断） (text)
	status INTEGER NOT NULL, -- HTTP 状态 (int4)
	duration_ms INTEGER NOT NULL, -- 耗时毫秒 (bigint)
	ip TEXT NULL, -- 客户端 IP (varchar)
	create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP -- 创建时间 (timestamptz -> ISO-8601 UTC)
);
CREATE INDEX idx_sys_operation_log_time ON sys_operation_log(create_time);
CREATE INDEX idx_sys_operation_log_trace ON sys_operation_log(trace_id);
CREATE INDEX idx_sys_operation_log_username ON sys_operation_log(username);
