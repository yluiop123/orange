package auth

// Principal is the authenticated user attached to a request. It is built once
// per request from the database, never trusted from the token.
type Principal struct {
	UserID             string
	Username           string
	TokenVersion       int
	MustChangePassword bool
	Enabled            bool
	Effective          EffectivePermissions
}

// EffectivePermissions is an alias-free local view used by middleware and the
// grant guard. It is filled from domain.Effective by the auth service.
type EffectivePermissions struct {
	Authorities map[string]bool
	Permissions map[string]bool
	Super       bool
}

func (p *Principal) HasAuthority(authority string) bool {
	return p != nil && p.Effective.Authorities[authority]
}

func (p *Principal) HasPermission(permissionID string) bool {
	return p != nil && p.Effective.Permissions[permissionID]
}

func (p *Principal) IsSuper() bool {
	return p != nil && p.Effective.Super
}
