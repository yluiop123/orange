package domain

import "strings"

const (
	PermissionTypeMenu      = "menu"
	PermissionTypeAction    = "action"
	PermissionTypeDirectory = "directory"
)

// ValidatePermissionShape enforces the type/action combination rules:
// action permissions require a non-blank action, menu and directory
// permissions must not carry one. Blank actions are normalized to nil at the
// persistence boundary so the database has one representation.
func ValidatePermissionShape(permissionType string, action *string) error {
	switch permissionType {
	case PermissionTypeAction:
		if action == nil || strings.TrimSpace(*action) == "" {
			return Validation("action 类型的权限必须填写 action")
		}
		return nil
	case PermissionTypeMenu, PermissionTypeDirectory:
		if action != nil && strings.TrimSpace(*action) != "" {
			return Validation("menu/directory 类型的权限不能填写 action")
		}
		return nil
	default:
		return Validation("权限类型只能是 menu、action 或 directory")
	}
}

func ValidPermissionType(permissionType string) bool {
	switch permissionType {
	case PermissionTypeMenu, PermissionTypeAction, PermissionTypeDirectory:
		return true
	default:
		return false
	}
}

// NormalizeAction trims an action and treats blank as absent (nil).
func NormalizeAction(action *string) *string {
	if action == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*action)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

// AuthorityOf renders the type#path or type#path:action authority string.
func AuthorityOf(permissionType, path string, action *string) string {
	authority := permissionType + "#" + path
	if action != nil && strings.TrimSpace(*action) != "" {
		authority += ":" + strings.TrimSpace(*action)
	}
	return authority
}
