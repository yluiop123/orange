package store

import (
	"context"

	"gorm.io/gorm"
)

func (s *Store) AllPermissions(ctx context.Context) ([]Permission, error) {
	var permissions []Permission
	err := s.db.WithContext(ctx).Order("id").Find(&permissions).Error
	return permissions, err
}

func (s *Store) EnabledMenuPermissions(ctx context.Context) ([]Permission, error) {
	var permissions []Permission
	err := s.db.WithContext(ctx).
		Where("status = ? AND type IN ?", "1", []string{"menu", "directory"}).
		Order("id").
		Find(&permissions).Error
	return permissions, err
}

func (s *Store) FindPermission(ctx context.Context, id string) (*Permission, error) {
	var permission Permission
	if err := s.db.WithContext(ctx).Where("id = ?", id).First(&permission).Error; err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return &permission, nil
}

func (s *Store) PermissionExists(ctx context.Context, id string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&Permission{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

// PermissionIdentityExists checks (type, path, action) with NULL/absent action
// treated as a single value. excludeID skips the edited row.
func (s *Store) PermissionIdentityExists(ctx context.Context, permissionType, path string, action *string, excludeID string) (bool, error) {
	query := s.db.WithContext(ctx).Model(&Permission{}).
		Where("type = ? AND path = ?", permissionType, path)
	if action == nil {
		query = query.Where("action IS NULL")
	} else {
		query = query.Where("action = ?", *action)
	}
	if excludeID != "" {
		query = query.Where("id <> ?", excludeID)
	}
	var count int64
	err := query.Count(&count).Error
	return count > 0, err
}

// PermissionTranslations returns the locale -> name rows of one permission.
func (s *Store) PermissionTranslations(ctx context.Context, permissionID string) (map[string]string, error) {
	var rows []PermissionI18n
	if err := s.db.WithContext(ctx).Where("permission_id = ?", permissionID).Find(&rows).Error; err != nil {
		return nil, err
	}
	translations := make(map[string]string, len(rows))
	for _, row := range rows {
		translations[row.Locale] = row.Name
	}
	return translations, nil
}

// AllPermissionTranslations returns permission id -> locale -> name in a single
// query so list and menu responses do not issue one query per row.
func (s *Store) AllPermissionTranslations(ctx context.Context) (map[string]map[string]string, error) {
	var rows []PermissionI18n
	if err := s.db.WithContext(ctx).Find(&rows).Error; err != nil {
		return nil, err
	}
	translations := make(map[string]map[string]string)
	for _, row := range rows {
		if translations[row.PermissionID] == nil {
			translations[row.PermissionID] = make(map[string]string)
		}
		translations[row.PermissionID][row.Locale] = row.Name
	}
	return translations, nil
}

// CreatePermission inserts the permission and its translations atomically.
func (s *Store) CreatePermission(ctx context.Context, permission *Permission, translations map[string]string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Create(permission).Error; err != nil {
			return err
		}
		return createPermissionTranslations(tx, permission.ID, translations)
	})
}

// SavePermission persists the permission and, when translations is not nil,
// replaces every translation row of that permission.
func (s *Store) SavePermission(ctx context.Context, permission *Permission, translations map[string]string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Save(permission).Error; err != nil {
			return err
		}
		if translations == nil {
			return nil
		}
		return replacePermissionTranslations(tx, permission.ID, translations)
	})
}

// DeletePermissionsInOrder deletes children before parents. Translation rows
// are removed explicitly instead of relying on the foreign key cascade, which
// is not enabled on every supported driver configuration.
func (s *Store) DeletePermissionsInOrder(ctx context.Context, permissions []Permission) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		for _, permission := range permissions {
			if err := tx.Where("permission_id = ?", permission.ID).Delete(&PermissionI18n{}).Error; err != nil {
				return err
			}
			if err := tx.Where("id = ?", permission.ID).Delete(&Permission{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func createPermissionTranslations(tx *gorm.DB, permissionID string, translations map[string]string) error {
	for locale, name := range translations {
		row := PermissionI18n{PermissionID: permissionID, Locale: locale, Name: name}
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

func replacePermissionTranslations(tx *gorm.DB, permissionID string, translations map[string]string) error {
	if err := tx.Where("permission_id = ?", permissionID).Delete(&PermissionI18n{}).Error; err != nil {
		return err
	}
	return createPermissionTranslations(tx, permissionID, translations)
}

func (s *Store) ExistsRolePermissionIn(ctx context.Context, permissionIDs []string) (bool, error) {
	if len(permissionIDs) == 0 {
		return false, nil
	}
	var count int64
	err := s.db.WithContext(ctx).Model(&RolePermission{}).
		Where("permission_id IN ?", permissionIDs).Count(&count).Error
	return count > 0, err
}

func (s *Store) ExistsUserPermissionIn(ctx context.Context, permissionIDs []string) (bool, error) {
	if len(permissionIDs) == 0 {
		return false, nil
	}
	var count int64
	err := s.db.WithContext(ctx).Model(&UserPermission{}).
		Where("permission_id IN ?", permissionIDs).Count(&count).Error
	return count > 0, err
}
