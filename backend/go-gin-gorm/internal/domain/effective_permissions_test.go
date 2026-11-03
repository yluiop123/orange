package domain

import "testing"

func TestComputeEffectiveFiltersDisabledAndUnions(t *testing.T) {
	activeRole := Role{
		ID: "super", Name: "Super", Status: StatusEnabled,
		Permissions: []Permission{
			{ID: "000500", Type: "menu", Path: "/system/user", Status: StatusEnabled},
			{ID: "000501", Type: "menu", Path: "/system/role", Status: StatusDisabled},
		},
	}
	disabledRole := Role{
		ID: "admin", Name: "Admin", Status: StatusDisabled,
		Permissions: []Permission{
			{ID: "000502", Type: "menu", Path: "/system/permission", Status: StatusEnabled},
		},
	}
	addAction := "add"
	direct := []Permission{
		{ID: "00050000", Type: "action", Path: "/system/user", Action: &addAction, Status: StatusEnabled},
		{ID: "00050001", Type: "action", Path: "/system/user", Action: strPtr("delete"), Status: StatusDisabled},
		// Directly granted menu duplicates a role grant; it stays in the direct
		// list but only once in the union.
		{ID: "000500", Type: "menu", Path: "/system/user", Status: StatusEnabled},
	}

	effective := ComputeEffective([]Role{activeRole, disabledRole}, direct)

	if len(effective.Roles) != 1 || effective.Roles[0].ID != "super" {
		t.Fatalf("active roles = %+v, want only super", effective.Roles)
	}
	if !effective.IsSuper() {
		t.Fatal("expected super")
	}
	if len(effective.Permissions) != 2 {
		t.Fatalf("permissions = %+v, want 2", effective.Permissions)
	}
	if len(effective.RolePermissions) != 1 || effective.RolePermissions[0].Permission.ID != "000500" {
		t.Fatalf("role permissions = %+v, want only enabled 000500", effective.RolePermissions)
	}
	if len(effective.DirectPermissions) != 2 {
		t.Fatalf("direct permissions = %+v, want enabled ones only", effective.DirectPermissions)
	}
	for _, authority := range []string{
		"000500", "00050000", "menu#/system/user", "action#/system/user:add",
	} {
		if !effective.HasAuthority(authority) {
			t.Fatalf("missing authority %q in %+v", authority, effective.Authorities)
		}
	}
	for _, absent := range []string{
		"000501", "000502", "00050001", "action#/system/user:delete", "menu#/system/role",
	} {
		if effective.HasAuthority(absent) {
			t.Fatalf("unexpected authority %q", absent)
		}
	}
}

func TestComputeEffectiveWithoutRoles(t *testing.T) {
	effective := ComputeEffective(nil, nil)
	if len(effective.Permissions) != 0 || len(effective.Authorities) != 0 {
		t.Fatalf("expected empty effective permissions, got %+v", effective)
	}
	if effective.IsSuper() {
		t.Fatal("empty user must not be super")
	}
}

func strPtr(value string) *string { return &value }
