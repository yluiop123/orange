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

func (s *Store) CreatePermission(ctx context.Context, permission *Permission) error {
	return s.db.WithContext(ctx).Create(permission).Error
}

func (s *Store) SavePermission(ctx context.Context, permission *Permission) error {
	return s.db.WithContext(ctx).Save(permission).Error
}

func (s *Store) DeletePermissionsInOrder(ctx context.Context, permissions []Permission) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		for _, permission := range permissions {
			if err := tx.Where("id = ?", permission.ID).Delete(&Permission{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
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
