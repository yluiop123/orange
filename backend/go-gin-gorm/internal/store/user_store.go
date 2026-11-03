package store

import (
	"context"
	"strings"

	"gorm.io/gorm"
)

type UserListFilter struct {
	Keyword   string
	Status    string
	GroupID   string
	SortBy    string
	Direction string
	Page      int
	Size      int
}

func (s *Store) ListUsers(ctx context.Context, filter UserListFilter) (int64, []User, error) {
	query := s.db.WithContext(ctx).Model(&User{})
	if keyword := strings.TrimSpace(filter.Keyword); keyword != "" {
		pattern := likePrefix(strings.ToLower(keyword))
		query = query.Where(
			"(LOWER(name) LIKE ? ESCAPE '!' OR LOWER(username) LIKE ? ESCAPE '!' OR LOWER(email) LIKE ? ESCAPE '!' OR LOWER(phone) LIKE ? ESCAPE '!')",
			pattern, pattern, pattern, pattern,
		)
	}
	if status := strings.TrimSpace(filter.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if groupID := strings.TrimSpace(filter.GroupID); groupID != "" {
		query = query.Where("LOWER(group_id) LIKE ? ESCAPE '!'", likePrefix(strings.ToLower(groupID)))
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return 0, nil, err
	}

	order := filter.SortBy + " " + filter.Direction
	var users []User
	err := query.Order(order).
		Offset((filter.Page - 1) * filter.Size).
		Limit(filter.Size).
		Find(&users).Error
	return total, users, err
}

func (s *Store) FindUserByID(ctx context.Context, id string) (*User, error) {
	var user User
	if err := s.db.WithContext(ctx).Where("id = ?", id).First(&user).Error; err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (s *Store) UsersByIDs(ctx context.Context, ids []string) ([]User, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var users []User
	err := s.db.WithContext(ctx).Where("id IN ?", ids).Find(&users).Error
	return users, err
}

func (s *Store) FindUserByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	if err := s.db.WithContext(ctx).Where("username = ?", username).First(&user).Error; err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (s *Store) UserExistsByUsername(ctx context.Context, username string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

func (s *Store) RolesForUser(ctx context.Context, userID string) ([]Role, error) {
	var roles []Role
	err := s.db.WithContext(ctx).
		Table("sys_role AS r").
		Select("r.*").
		Joins("JOIN sys_user_role AS ur ON ur.role_id = r.id").
		Where("ur.user_id = ?", userID).
		Order("r.id").
		Scan(&roles).Error
	return roles, err
}

// PermissionsForRoles returns roleID -> permissions, ordered by permission id.
func (s *Store) PermissionsForRoles(ctx context.Context, roleIDs []string) (map[string][]Permission, error) {
	result := make(map[string][]Permission, len(roleIDs))
	if len(roleIDs) == 0 {
		return result, nil
	}
	var links []RolePermission
	if err := s.db.WithContext(ctx).Where("role_id IN ?", roleIDs).Find(&links).Error; err != nil {
		return nil, err
	}
	permissionIDs := make([]string, 0, len(links))
	seen := make(map[string]bool, len(links))
	for _, link := range links {
		if !seen[link.PermissionID] {
			seen[link.PermissionID] = true
			permissionIDs = append(permissionIDs, link.PermissionID)
		}
	}
	permissionsByID := make(map[string]Permission, len(permissionIDs))
	if len(permissionIDs) > 0 {
		var permissions []Permission
		if err := s.db.WithContext(ctx).Where("id IN ?", permissionIDs).Order("id").Find(&permissions).Error; err != nil {
			return nil, err
		}
		for _, permission := range permissions {
			permissionsByID[permission.ID] = permission
		}
	}
	for _, link := range links {
		if permission, ok := permissionsByID[link.PermissionID]; ok {
			result[link.RoleID] = append(result[link.RoleID], permission)
		}
	}
	return result, nil
}

func (s *Store) DirectPermissionsForUser(ctx context.Context, userID string) ([]Permission, error) {
	var permissions []Permission
	err := s.db.WithContext(ctx).
		Table("sys_permission AS p").
		Select("p.*").
		Joins("JOIN sys_user_permission AS up ON up.permission_id = p.id").
		Where("up.user_id = ?", userID).
		Order("p.id").
		Scan(&permissions).Error
	return permissions, err
}

func (s *Store) DirectPermissionIDsForUser(ctx context.Context, userID string) ([]string, error) {
	var links []UserPermission
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Find(&links).Error; err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(links))
	for _, link := range links {
		ids = append(ids, link.PermissionID)
	}
	return ids, nil
}

func (s *Store) GroupNames(ctx context.Context) (map[string]string, error) {
	var rows []GroupName
	if err := s.db.WithContext(ctx).Table("sys_group").Select("id, name").Find(&rows).Error; err != nil {
		return nil, err
	}
	names := make(map[string]string, len(rows))
	for _, row := range rows {
		names[row.ID] = row.Name
	}
	return names, nil
}

func (s *Store) CreateUser(ctx context.Context, user *User, roleIDs, permissionIDs []string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		for _, roleID := range dedupe(roleIDs) {
			if err := tx.Create(&UserRole{UserID: user.ID, RoleID: roleID}).Error; err != nil {
				return err
			}
		}
		for _, permissionID := range dedupe(permissionIDs) {
			if err := tx.Create(&UserPermission{UserID: user.ID, PermissionID: permissionID}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) SaveUser(ctx context.Context, user *User) error {
	return s.db.WithContext(ctx).Save(user).Error
}

func (s *Store) ReplaceUserRoles(ctx context.Context, userID string, roleIDs []string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&UserRole{}).Error; err != nil {
			return err
		}
		for _, roleID := range dedupe(roleIDs) {
			if err := tx.Create(&UserRole{UserID: userID, RoleID: roleID}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) ReplaceUserPermissions(ctx context.Context, userID string, permissionIDs []string) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&UserPermission{}).Error; err != nil {
			return err
		}
		for _, permissionID := range dedupe(permissionIDs) {
			if err := tx.Create(&UserPermission{UserID: userID, PermissionID: permissionID}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) DeleteUsers(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return s.transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Where("user_id IN ?", ids).Delete(&UserRole{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id IN ?", ids).Delete(&UserPermission{}).Error; err != nil {
			return err
		}
		return tx.Where("id IN ?", ids).Delete(&User{}).Error
	})
}

func (s *Store) CountEnabledSuperUsers(ctx context.Context) (int64, error) {
	var count int64
	err := s.db.WithContext(ctx).
		Table("sys_user AS u").
		Joins("JOIN sys_user_role AS ur ON ur.user_id = u.id").
		Where("ur.role_id = ? AND u.status = ?", "super", "1").
		Distinct("u.id").
		Count(&count).Error
	return count, err
}

func (s *Store) UsersWithRole(ctx context.Context, roleID string) (map[string]bool, error) {
	var links []UserRole
	if err := s.db.WithContext(ctx).Where("role_id = ?", roleID).Find(&links).Error; err != nil {
		return nil, err
	}
	result := make(map[string]bool, len(links))
	for _, link := range links {
		result[link.UserID] = true
	}
	return result, nil
}

func dedupe(values []string) []string {
	seen := make(map[string]bool, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value != "" && !seen[value] {
			seen[value] = true
			result = append(result, value)
		}
	}
	return result
}
