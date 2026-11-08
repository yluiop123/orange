-- OceanBase (MySQL mode) schema for Orange (ported from database/postgres/ddl.sql)
-- Target: OceanBase 4.x MySQL mode. CHECK constraints are declared for parity
-- but may be ignored by older versions; see the repository README.

SET NAMES utf8mb4;

-- Drop tables (child first)

-- DROP TABLE IF EXISTS `sys_operation_log`;
-- DROP TABLE IF EXISTS `sys_login_attempt`;
-- DROP TABLE IF EXISTS `sys_revoked_token`;
-- DROP TABLE IF EXISTS `sys_user_role`;
-- DROP TABLE IF EXISTS `sys_user_permission`;
-- DROP TABLE IF EXISTS `sys_role_permission`;
-- DROP TABLE IF EXISTS `sys_user`;
-- DROP TABLE IF EXISTS `sys_role`;
-- DROP TABLE IF EXISTS `sys_permission`;
-- DROP TABLE IF EXISTS `sys_group`;

-- sys_group definition

CREATE TABLE `sys_group` (
	`id` varchar(64) NOT NULL COMMENT '组织id',
	`name` varchar(255) NULL COMMENT '组织名',
	`status` varchar(8) NOT NULL DEFAULT '1' COMMENT '状态',
	`create_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
	`parent_id` varchar(64) NULL COMMENT '父组织id',
	`update_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '更新时间',
	`created_by` varchar(255) NULL COMMENT '创建人',
	`updated_by` varchar(255) NULL COMMENT '更新人',
	`version` int NOT NULL DEFAULT 0 COMMENT '乐观锁版本',
	CONSTRAINT `sys_group_pkey` PRIMARY KEY (`id`),
	CONSTRAINT `ck_sys_group_status` CHECK (`status` IN ('0', '1')),
	CONSTRAINT `ck_sys_group_code` CHECK (
		`id` REGEXP '^[0-9]+$'
		AND (
			(`parent_id` IS NULL AND LENGTH(`id`) = 2)
			OR (`parent_id` IS NOT NULL AND LENGTH(`id`) = LENGTH(`parent_id`) + 2 AND LEFT(`id`, LENGTH(`parent_id`)) = `parent_id`)
		)
	),
	CONSTRAINT `fk_sys_group_parent` FOREIGN KEY (`parent_id`) REFERENCES `sys_group` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='组织机构表';
CREATE INDEX `idx_sys_group_parent` ON `sys_group` (`parent_id`, `id`);

-- sys_permission definition

CREATE TABLE `sys_permission` (
	`id` varchar(64) NOT NULL COMMENT '权限id',
	`name` varchar(255) NULL COMMENT '权限名',
	`path` varchar(500) NOT NULL COMMENT '权限路径',
	`action` varchar(100) NULL COMMENT '权限动作；menu/directory 必须为 NULL',
	`action_key` varchar(100) GENERATED ALWAYS AS (COALESCE(`action`, '')) STORED COMMENT '权限身份用动作键；NULL 归一化为空串',
	`type` varchar(32) NOT NULL COMMENT '权限类型',
	`status` varchar(8) NOT NULL DEFAULT '1' COMMENT '权限状态',
	`parent_id` varchar(64) NULL COMMENT '父权限id',
	`create_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
	`update_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '更新时间',
	`created_by` varchar(255) NULL COMMENT '创建人',
	`updated_by` varchar(255) NULL COMMENT '更新人',
	`version` int NOT NULL DEFAULT 0 COMMENT '乐观锁版本',
	CONSTRAINT `sys_permission_pkey` PRIMARY KEY (`id`),
	CONSTRAINT `ck_sys_permission_status` CHECK (`status` IN ('0', '1')),
	CONSTRAINT `ck_sys_permission_type` CHECK (`type` IN ('menu', 'action', 'directory')),
	CONSTRAINT `ck_sys_permission_path` CHECK (TRIM(`path`) <> ''),
	CONSTRAINT `ck_sys_permission_action_shape` CHECK (
		(`type` = 'action' AND `action` IS NOT NULL AND TRIM(`action`) <> '')
		OR (`type` IN ('menu', 'directory') AND `action` IS NULL)
	),
	CONSTRAINT `ck_sys_permission_code` CHECK (
		`id` REGEXP '^[0-9]+$'
		AND (
			(`parent_id` IS NULL AND LENGTH(`id`) = 4)
			OR (`parent_id` IS NOT NULL AND LENGTH(`id`) = LENGTH(`parent_id`) + 2 AND LEFT(`id`, LENGTH(`parent_id`)) = `parent_id`)
		)
	),
	CONSTRAINT `fk_sys_permission_parent` FOREIGN KEY (`parent_id`) REFERENCES `sys_permission` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='权限表';

CREATE TABLE `sys_permission_i18n` (
	`permission_id` varchar(64) NOT NULL COMMENT '权限id',
	`locale` varchar(16) NOT NULL COMMENT '语言标签',
	`name` varchar(255) NOT NULL COMMENT '本地化名称',
	CONSTRAINT `sys_permission_i18n_pkey` PRIMARY KEY (`permission_id`, `locale`),
	CONSTRAINT `fk_sys_permission_i18n_permission` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX `idx_sys_permission_parent` ON `sys_permission` (`parent_id`, `id`);
-- 权限身份唯一：action 权限按 (type, path, action)，菜单/目录按 (type, path)。
-- Postgres 用两个部分唯一索引表达；MySQL 没有部分索引，用生成列 action_key
-- （action IS NULL -> ''）加一个唯一键表达同样的语义。
CREATE UNIQUE INDEX `uq_sys_permission_identity` ON `sys_permission` (`type`, `path`, `action_key`);

-- sys_role definition

CREATE TABLE `sys_role` (
	`id` varchar(64) NOT NULL COMMENT '角色id',
	`name` varchar(255) NULL COMMENT '角色名',
	`status` varchar(8) NOT NULL DEFAULT '1' COMMENT '角色状态',
	`create_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
	`update_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '更新时间',
	`created_by` varchar(255) NULL COMMENT '创建人',
	`updated_by` varchar(255) NULL COMMENT '更新人',
	`version` int NOT NULL DEFAULT 0 COMMENT '乐观锁版本',
	CONSTRAINT `sys_role_pkey` PRIMARY KEY (`id`),
	CONSTRAINT `ck_sys_role_status` CHECK (`status` IN ('0', '1'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色表';

-- sys_role_permission definition

CREATE TABLE `sys_role_permission` (
	`role_id` varchar(64) NOT NULL COMMENT '角色id',
	`permission_id` varchar(64) NOT NULL COMMENT '权限id',
	CONSTRAINT `sys_role_permission_pkey` PRIMARY KEY (`role_id`, `permission_id`),
	CONSTRAINT `fk_sys_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sys_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='角色-权限关系表';

-- sys_user definition

CREATE TABLE `sys_user` (
	`id` varchar(64) NOT NULL COMMENT '用户id',
	`name` varchar(255) NULL COMMENT '用户姓名',
	`username` varchar(255) NOT NULL COMMENT '用户名',
	`email` varchar(255) NULL COMMENT '用户邮箱',
	`group_id` varchar(64) NULL COMMENT '用户组织id',
	`phone` varchar(32) NULL COMMENT '用户电话',
	`status` varchar(8) NOT NULL DEFAULT '1' COMMENT '用户状态',
	`token_version` int NOT NULL DEFAULT 0 COMMENT '令牌版本，递增后旧 token 失效',
	`must_change_password` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否需要强制修改密码',
	`version` int NOT NULL DEFAULT 0 COMMENT '乐观锁版本',
	`create_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
	`update_time` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '更新时间',
	`created_by` varchar(255) NULL COMMENT '创建人',
	`updated_by` varchar(255) NULL COMMENT '更新人',
	`password` varchar(255) NULL COMMENT '用户密码',
	CONSTRAINT `sys_user_pkey` PRIMARY KEY (`id`),
	CONSTRAINT `unique_username` UNIQUE (`username`),
	CONSTRAINT `ck_sys_user_status` CHECK (`status` IN ('0', '1')),
	CONSTRAINT `fk_sys_user_group` FOREIGN KEY (`group_id`) REFERENCES `sys_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';
CREATE INDEX `idx_sys_user_group` ON `sys_user` (`group_id`);

-- sys_user_permission definition

CREATE TABLE `sys_user_permission` (
	`user_id` varchar(64) NOT NULL COMMENT '用户id',
	`permission_id` varchar(64) NOT NULL COMMENT '权限id',
	CONSTRAINT `sys_user_permission_pkey` PRIMARY KEY (`user_id`, `permission_id`),
	CONSTRAINT `fk_sys_user_permission_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sys_user_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `sys_permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户-权限关系表';

-- sys_user_role definition

CREATE TABLE `sys_user_role` (
	`user_id` varchar(64) NOT NULL COMMENT '用户id',
	`role_id` varchar(64) NOT NULL COMMENT '角色id',
	CONSTRAINT `sys_user_role_pkey` PRIMARY KEY (`user_id`, `role_id`),
	CONSTRAINT `fk_sys_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sys_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户-角色关系表';

-- sys_revoked_token definition

CREATE TABLE `sys_revoked_token` (
	`jti` varchar(64) NOT NULL COMMENT 'token 唯一标识',
	`token_type` varchar(16) NOT NULL COMMENT 'access / refresh',
	`expires_at` datetime(6) NOT NULL COMMENT '原 token 过期时间',
	`create_time` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '吊销时间',
	CONSTRAINT `sys_revoked_token_pkey` PRIMARY KEY (`jti`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='已吊销 token 表';
CREATE INDEX `idx_sys_revoked_token_expires` ON `sys_revoked_token` (`expires_at`);

-- sys_login_attempt definition

CREATE TABLE `sys_login_attempt` (
	`attempt_key` varchar(255) NOT NULL COMMENT 'ip:xxx / user:xxx',
	`failures` int NOT NULL DEFAULT 0 COMMENT '窗口内失败次数',
	`window_start` datetime(6) NOT NULL COMMENT '统计窗口开始时间',
	`locked_until` datetime(6) NULL COMMENT '锁定截止时间',
	`update_time` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '更新时间',
	CONSTRAINT `sys_login_attempt_pkey` PRIMARY KEY (`attempt_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='登录失败/锁定记录表';
CREATE INDEX `idx_sys_login_attempt_locked` ON `sys_login_attempt` (`locked_until`);

-- sys_operation_log definition

CREATE TABLE `sys_operation_log` (
	`id` bigint NOT NULL AUTO_INCREMENT,
	`trace_id` varchar(64) NULL COMMENT '链路追踪 ID',
	`username` varchar(255) NULL COMMENT '操作人',
	`method` varchar(16) NOT NULL COMMENT 'HTTP 方法',
	`path` varchar(500) NOT NULL COMMENT '请求路径',
	`query_string` varchar(512) NULL COMMENT '查询参数',
	`request_body` text NULL COMMENT '请求体（已脱敏并截断）',
	`status` int NOT NULL COMMENT 'HTTP 状态',
	`duration_ms` bigint NOT NULL COMMENT '耗时毫秒',
	`ip` varchar(64) NULL COMMENT '客户端 IP',
	`create_time` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
	CONSTRAINT `sys_operation_log_pkey` PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='操作日志表';
CREATE INDEX `idx_sys_operation_log_time` ON `sys_operation_log` (`create_time`);
CREATE INDEX `idx_sys_operation_log_trace` ON `sys_operation_log` (`trace_id`);
CREATE INDEX `idx_sys_operation_log_username` ON `sys_operation_log` (`username`);
