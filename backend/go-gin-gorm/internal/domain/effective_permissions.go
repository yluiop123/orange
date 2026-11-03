package domain

// Permission is the pure representation used for RBAC decisions.
type Permission struct {
	ID     string
	Type   string
	Path   string
	Action *string
	Status string
}

// Role carries its granted permissions. The role status controls whether its
// grants count at all.
type Role struct {
	ID          string
	Name        string
	Status      string
	Permissions []Permission
}

// RolePermission links a role to one of its enabled permissions.
type RolePermission struct {
	RoleID     string
	Permission Permission
}

// Effective is the single source of truth for "what may this user do":
// union of enabled roles' enabled permissions + enabled direct permissions.
type Effective struct {
	Roles             []Role
	RolePermissions   []RolePermission
	DirectPermissions []Permission
	Permissions       []Permission
	Authorities       map[string]bool
}

func (e Effective) HasAuthority(authority string) bool {
	return e.Authorities[authority]
}

func (e Effective) HasPermissionID(id string) bool {
	return e.Authorities[id]
}

func (e Effective) IsSuper() bool {
	for _, role := range e.Roles {
		if role.ID == "super" {
			return true
		}
	}
	return false
}

// ComputeEffective applies the RBAC invariant exactly once. Disabled roles and
// disabled permissions are removed; a permission granted through several roles
// stays one entry in Permissions but keeps one RolePermission row per role.
func ComputeEffective(roles []Role, directPermissions []Permission) Effective {
	activeRoles := make([]Role, 0, len(roles))
	rolePermissions := make([]RolePermission, 0)
	seen := make(map[string]bool)
	permissions := make([]Permission, 0)

	for _, role := range roles {
		if role.Status == StatusDisabled {
			continue
		}
		activeRoles = append(activeRoles, role)
		for _, permission := range role.Permissions {
			if permission.Status == StatusDisabled {
				continue
			}
			rolePermissions = append(rolePermissions, RolePermission{RoleID: role.ID, Permission: permission})
			if !seen[permission.ID] {
				seen[permission.ID] = true
				permissions = append(permissions, permission)
			}
		}
	}

	direct := make([]Permission, 0, len(directPermissions))
	for _, permission := range directPermissions {
		if permission.Status == StatusDisabled {
			continue
		}
		direct = append(direct, permission)
		if !seen[permission.ID] {
			seen[permission.ID] = true
			permissions = append(permissions, permission)
		}
	}

	authorities := make(map[string]bool, len(permissions)*2)
	for _, permission := range permissions {
		authorities[permission.ID] = true
		authorities[AuthorityOf(permission.Type, permission.Path, permission.Action)] = true
	}

	return Effective{
		Roles:             activeRoles,
		RolePermissions:   rolePermissions,
		DirectPermissions: direct,
		Permissions:       permissions,
		Authorities:       authorities,
	}
}
