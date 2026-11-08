package service

import (
	"context"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/orange/backend-go-gin-gorm/internal/config"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

func newPermissionTestService(t *testing.T) (*Service, *store.Store) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "permission.db")), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	t.Cleanup(func() {
		if sqlDB, err := db.DB(); err == nil {
			_ = sqlDB.Close()
		}
	})
	if err := db.AutoMigrate(
		&store.Permission{},
		&store.PermissionI18n{},
		&store.RolePermission{},
		&store.UserPermission{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	st := store.New(db)
	return New(st, nil, config.Lockout{}), st
}

func assertTranslations(t *testing.T, got, want map[string]string) {
	t.Helper()
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("translations = %#v, want %#v", got, want)
	}
}

func TestMenusLocalizeStoredTranslations(t *testing.T) {
	svc, _ := newPermissionTestService(t)
	ctx := context.Background()

	if _, err := svc.AddPermission(ctx, "0001", "仪表盘", "/dashboard", nil,
		domain.PermissionTypeMenu, nil, map[string]string{"en": "Dashboard", "zh-CN": "仪表盘"}); err != nil {
		t.Fatalf("add permission: %v", err)
	}

	tests := []struct {
		locale string
		want   string
	}{
		{locale: "en", want: "Dashboard"},
		{locale: "EN-us", want: "Dashboard"},
		{locale: "zh-CN", want: "仪表盘"},
		{locale: "", want: "仪表盘"},
		{locale: "fr", want: "仪表盘"},
	}
	for _, test := range tests {
		menus, err := svc.Menus(ctx, test.locale)
		if err != nil {
			t.Fatalf("menus(%q): %v", test.locale, err)
		}
		if len(menus) != 1 || menus[0].ID != "0001" {
			t.Fatalf("menus(%q) = %#v, want one node 0001", test.locale, menus)
		}
		if menus[0].Name != test.want {
			t.Fatalf("menus(%q) name = %q, want %q", test.locale, menus[0].Name, test.want)
		}
	}
}

func TestPermissionTranslationsReadWrite(t *testing.T) {
	svc, st := newPermissionTestService(t)
	ctx := context.Background()

	created, err := svc.AddPermission(ctx, "0001", "仪表盘", "/dashboard", nil,
		domain.PermissionTypeMenu, nil, map[string]string{"en": "Dashboard", "zh-CN": "仪表盘"})
	if err != nil {
		t.Fatalf("add permission: %v", err)
	}
	want := map[string]string{"en": "Dashboard", "zh-CN": "仪表盘"}
	assertTranslations(t, created.Translations, want)

	got, err := svc.GetPermission(ctx, "0001")
	if err != nil {
		t.Fatalf("get permission: %v", err)
	}
	assertTranslations(t, got.Translations, want)

	list, err := svc.ListPermissions(ctx, "", "", "", "", "")
	if err != nil {
		t.Fatalf("list permissions: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("list length = %d, want 1", len(list))
	}
	assertTranslations(t, list[0].Translations, want)

	// Omitted translations keep the existing rows.
	name := "总览"
	if err := svc.UpdatePermission(ctx, "0001", PermissionUpdate{Name: &name}); err != nil {
		t.Fatalf("update name: %v", err)
	}
	got, err = svc.GetPermission(ctx, "0001")
	if err != nil {
		t.Fatalf("get after name update: %v", err)
	}
	if got.Name != name {
		t.Fatalf("name = %q, want %q", got.Name, name)
	}
	assertTranslations(t, got.Translations, want)

	// Provided translations replace every row.
	replacement := map[string]string{"en": "Control Panel"}
	if err := svc.UpdatePermission(ctx, "0001", PermissionUpdate{Translations: replacement}); err != nil {
		t.Fatalf("replace translations: %v", err)
	}
	got, err = svc.GetPermission(ctx, "0001")
	if err != nil {
		t.Fatalf("get after translation replacement: %v", err)
	}
	assertTranslations(t, got.Translations, replacement)

	// An explicitly empty map clears every row.
	if err := svc.UpdatePermission(ctx, "0001", PermissionUpdate{Translations: map[string]string{}}); err != nil {
		t.Fatalf("clear translations: %v", err)
	}
	got, err = svc.GetPermission(ctx, "0001")
	if err != nil {
		t.Fatalf("get after clearing translations: %v", err)
	}
	assertTranslations(t, got.Translations, map[string]string{})

	// Deleting the permission removes its translation rows explicitly.
	if err := svc.UpdatePermission(ctx, "0001", PermissionUpdate{Translations: replacement}); err != nil {
		t.Fatalf("restore translations: %v", err)
	}
	if err := svc.DeletePermissions(ctx, []string{"0001"}); err != nil {
		t.Fatalf("delete permission: %v", err)
	}
	rows, err := st.PermissionTranslations(ctx, "0001")
	if err != nil {
		t.Fatalf("read translations after delete: %v", err)
	}
	assertTranslations(t, rows, map[string]string{})
}
