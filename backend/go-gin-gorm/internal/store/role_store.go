package store

import (
	"context"
	"strings"

	"gorm.io/gorm"
)

type RoleListFilter struct {
	ID        string
	Name      string
	Status    string
	SortBy    string
	Direction string
	Page      int
	Size      int
}

func (s *Store) ListRoles(ctx context.Context, filter RoleListFilter) (int64, []Role, error) {
	query := s.db.WithContext(ctx).Model(&Role{})
	if id := strings.TrimSpace(filter.ID); id != "" {
		query = query.Where("LOWER(id) LIKE ? ESCAPE '!'", likePrefix(strings.ToLower(id)))
	}
	if name := strings.TrimSpace(filter.Name); name != "" {
		query = query.Where("LOWER(name) LIKE ? ESCAPE '!'", likePrefix(strings.ToLower(name)))
	}
	if status := strings.TrimSpace(filter.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return 0, nil, err
	}

	var roles []Role
	err := query.Order(filter.SortBy + " " + filter.Direction).
		Offset((filter.Page - 1) * filter.Size).
		Limit(filter.Size).
		Find(&roles).Error
	return total, roles, err
}

func (s *Store) FindRole(ctx context.Context, id string) (*Role, error) {
	var role Role
	if err := s.db.WithContext(ctx).Where("id = ?", id).First(&role).Error; err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return &role, nil
}

func (s *Store) RoleExists(ctx context.Context, id string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&Role{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

func (s *Store) RolesByIDs(ctx context.Context, ids []string) ([]Role, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var roles []Role
	err := s.db.WithContext(ctx).Where("id IN ?", ids).Find(&roles).Error
	return roles, err
}

func (s *Store) PermissionsForRole(ctx context.Context, roleID string) ([]string, error) {
	var links []RolePermission
	if err := s.db.WithContext(ctx).Where("role_id = ?", roleID).Find(&links).Error; err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(links))
	for _, link := range links {
		ids = append(ids, link.PermissionID)
	}
	return ids, nil
}

func (s *Store) CreateRole(ctx context.Context, role *Role, permissionIDs []string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Create(role).Error; err != nil {
			return err
		}
		for _, permissionID := range dedupe(permissionIDs) {
			if err := tx.Create(&RolePermission{RoleID: role.ID, PermissionID: permissionID}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) SaveRole(ctx context.Context, role *Role) error {
	return s.db.WithContext(ctx).Save(role).Error
}

func (s *Store) ReplaceRolePermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Where("role_id = ?", roleID).Delete(&RolePermission{}).Error; err != nil {
			return err
		}
		for _, permissionID := range dedupe(permissionIDs) {
			if err := tx.Create(&RolePermission{RoleID: roleID, PermissionID: permissionID}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) DeleteRoles(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Where("role_id IN ?", ids).Delete(&RolePermission{}).Error; err != nil {
			return err
		}
		return tx.Where("id IN ?", ids).Delete(&Role{}).Error
	})
}

func (s *Store) ExistsUserWithRoleIDs(ctx context.Context, roleIDs []string) (bool, error) {
	if len(roleIDs) == 0 {
		return false, nil
	}
	var count int64
	err := s.db.WithContext(ctx).Model(&UserRole{}).Where("role_id IN ?", roleIDs).Count(&count).Error
	return count > 0, err
}
