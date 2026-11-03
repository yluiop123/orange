package domain

import "testing"

func ptr(value string) *string { return &value }

func TestValidatePermissionShape(t *testing.T) {
	tests := []struct {
		name           string
		permissionType string
		action         *string
		wantErr        bool
	}{
		{name: "action with action", permissionType: PermissionTypeAction, action: ptr("add")},
		{name: "action without action", permissionType: PermissionTypeAction, wantErr: true},
		{name: "action with blank action", permissionType: PermissionTypeAction, action: ptr("  "), wantErr: true},
		{name: "menu without action", permissionType: PermissionTypeMenu},
		{name: "menu with action", permissionType: PermissionTypeMenu, action: ptr("add"), wantErr: true},
		{name: "directory without action", permissionType: PermissionTypeDirectory},
		{name: "directory with blank action", permissionType: PermissionTypeDirectory, action: ptr(" ")},
		{name: "unknown type", permissionType: "button", action: ptr("add"), wantErr: true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := ValidatePermissionShape(test.permissionType, test.action)
			if (err != nil) != test.wantErr {
				t.Fatalf("ValidatePermissionShape() error = %v, wantErr %v", err, test.wantErr)
			}
		})
	}
}

func TestNormalizeAction(t *testing.T) {
	if got := NormalizeAction(nil); got != nil {
		t.Fatalf("NormalizeAction(nil) = %v, want nil", got)
	}
	if got := NormalizeAction(ptr("   ")); got != nil {
		t.Fatalf("NormalizeAction(blank) = %v, want nil", got)
	}
	if got := NormalizeAction(ptr(" add ")); got == nil || *got != "add" {
		t.Fatalf("NormalizeAction(add) = %v, want add", got)
	}
}

func TestAuthorityOf(t *testing.T) {
	if got := AuthorityOf("menu", "/system/user", nil); got != "menu#/system/user" {
		t.Fatalf("menu authority = %q", got)
	}
	if got := AuthorityOf("action", "/system/user", ptr("add")); got != "action#/system/user:add" {
		t.Fatalf("action authority = %q", got)
	}
	if got := AuthorityOf("action", "/system/user", ptr("  ")); got != "action#/system/user" {
		t.Fatalf("blank action authority = %q", got)
	}
}
