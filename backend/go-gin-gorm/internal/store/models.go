package store

import (
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

type Group struct {
	ID         string     `gorm:"column:id;primaryKey"`
	Name       string     `gorm:"column:name"`
	Status     string     `gorm:"column:status"`
	ParentID   *string    `gorm:"column:parent_id"`
	CreateTime *time.Time `gorm:"column:create_time"`
	UpdateTime *time.Time `gorm:"column:update_time"`
	CreatedBy  *string    `gorm:"column:created_by"`
	UpdatedBy  *string    `gorm:"column:updated_by"`
	Version    int        `gorm:"column:version"`
}

func (Group) TableName() string { return "sys_group" }

type Permission struct {
	ID         string     `gorm:"column:id;primaryKey"`
	Name       string     `gorm:"column:name"`
	Path       string     `gorm:"column:path"`
	Action     *string    `gorm:"column:action"`
	Type       string     `gorm:"column:type"`
	Status     string     `gorm:"column:status"`
	ParentID   *string    `gorm:"column:parent_id"`
	CreateTime *time.Time `gorm:"column:create_time"`
	UpdateTime *time.Time `gorm:"column:update_time"`
	CreatedBy  *string    `gorm:"column:created_by"`
	UpdatedBy  *string    `gorm:"column:updated_by"`
	Version    int        `gorm:"column:version"`
}

func (Permission) TableName() string { return "sys_permission" }

func (p Permission) ToDomain() domain.Permission {
	return domain.Permission{
		ID:     p.ID,
		Type:   p.Type,
		Path:   p.Path,
		Action: p.Action,
		Status: p.Status,
	}
}

type Role struct {
	ID         string     `gorm:"column:id;primaryKey"`
	Name       string     `gorm:"column:name"`
	Status     string     `gorm:"column:status"`
	CreateTime *time.Time `gorm:"column:create_time"`
	UpdateTime *time.Time `gorm:"column:update_time"`
	CreatedBy  *string    `gorm:"column:created_by"`
	UpdatedBy  *string    `gorm:"column:updated_by"`
	Version    int        `gorm:"column:version"`
}

func (Role) TableName() string { return "sys_role" }

func (r Role) ToDomain(permissions []Permission) domain.Role {
	items := make([]domain.Permission, 0, len(permissions))
	for _, permission := range permissions {
		items = append(items, permission.ToDomain())
	}
	return domain.Role{ID: r.ID, Name: r.Name, Status: r.Status, Permissions: items}
}

type User struct {
	ID                 string     `gorm:"column:id;primaryKey"`
	Name               string     `gorm:"column:name"`
	Username           string     `gorm:"column:username"`
	Email              *string    `gorm:"column:email"`
	GroupID            *string    `gorm:"column:group_id"`
	Phone              *string    `gorm:"column:phone"`
	Status             string     `gorm:"column:status"`
	TokenVersion       int        `gorm:"column:token_version"`
	MustChangePassword bool       `gorm:"column:must_change_password"`
	Version            int        `gorm:"column:version"`
	Password           *string    `gorm:"column:password"`
	CreateTime         *time.Time `gorm:"column:create_time"`
	UpdateTime         *time.Time `gorm:"column:update_time"`
	CreatedBy          *string    `gorm:"column:created_by"`
	UpdatedBy          *string    `gorm:"column:updated_by"`
}

func (User) TableName() string { return "sys_user" }

type UserRole struct {
	UserID string `gorm:"column:user_id;primaryKey"`
	RoleID string `gorm:"column:role_id;primaryKey"`
}

func (UserRole) TableName() string { return "sys_user_role" }

type UserPermission struct {
	UserID       string `gorm:"column:user_id;primaryKey"`
	PermissionID string `gorm:"column:permission_id;primaryKey"`
}

func (UserPermission) TableName() string { return "sys_user_permission" }

type RolePermission struct {
	RoleID       string `gorm:"column:role_id;primaryKey"`
	PermissionID string `gorm:"column:permission_id;primaryKey"`
}

func (RolePermission) TableName() string { return "sys_role_permission" }

type RevokedToken struct {
	JTI        string     `gorm:"column:jti;primaryKey"`
	TokenType  string     `gorm:"column:token_type"`
	ExpiresAt  time.Time  `gorm:"column:expires_at"`
	CreateTime *time.Time `gorm:"column:create_time"`
}

func (RevokedToken) TableName() string { return "sys_revoked_token" }

type LoginAttempt struct {
	AttemptKey  string     `gorm:"column:attempt_key;primaryKey"`
	Failures    int        `gorm:"column:failures"`
	WindowStart time.Time  `gorm:"column:window_start"`
	LockedUntil *time.Time `gorm:"column:locked_until"`
	UpdateTime  time.Time  `gorm:"column:update_time"`
}

func (LoginAttempt) TableName() string { return "sys_login_attempt" }

type OperationLog struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement"`
	TraceID     *string   `gorm:"column:trace_id"`
	Username    *string   `gorm:"column:username"`
	Method      string    `gorm:"column:method"`
	Path        string    `gorm:"column:path"`
	QueryString *string   `gorm:"column:query_string"`
	RequestBody *string   `gorm:"column:request_body"`
	Status      int       `gorm:"column:status"`
	DurationMs  int64     `gorm:"column:duration_ms"`
	IP          *string   `gorm:"column:ip"`
	CreateTime  time.Time `gorm:"column:create_time"`
}

func (OperationLog) TableName() string { return "sys_operation_log" }

// Named references used by response builders.
type GroupName struct {
	ID   string `gorm:"column:id"`
	Name string `gorm:"column:name"`
}
