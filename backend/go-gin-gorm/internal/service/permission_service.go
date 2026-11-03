package service

import (
	"context"
	"strings"
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type PermissionBean struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Path       string  `json:"path"`
	Action     *string `json:"action"`
	Type       string  `json:"type"`
	Status     string  `json:"status"`
	ParentID   *string `json:"parentId"`
	CreateTime *string `json:"createTime"`
	UpdateTime *string `json:"updateTime"`
}

func permissionBean(permission store.Permission) PermissionBean {
	return PermissionBean{
		ID:         permission.ID,
		Name:       permission.Name,
		Path:       permission.Path,
		Action:     permission.Action,
		Type:       permission.Type,
		Status:     permission.Status,
		ParentID:   permission.ParentID,
		CreateTime: beanTime(permission.CreateTime),
		UpdateTime: beanTime(permission.UpdateTime),
	}
}

func permissionIndex(permissions []store.Permission) *domain.TreeIndex[store.Permission] {
	return domain.NewTreeIndex(permissions,
		func(permission store.Permission) string { return permission.ID },
		func(permission store.Permission) *string { return permission.ParentID },
	)
}

func (s *Service) ListPermissions(ctx context.Context, id, name, path, status, permissionType string) ([]PermissionBean, error) {
	all, err := s.store.AllPermissions(ctx)
	if err != nil {
		return nil, err
	}
	matched := make([]store.Permission, 0, len(all))
	for _, permission := range all {
		if id != "" && !hasPrefixFold(permission.ID, id) {
			continue
		}
		if name != "" && !hasPrefixFold(permission.Name, name) {
			continue
		}
		if path != "" && !hasPrefixFold(permission.Path, path) {
			continue
		}
		if status != "" && status != domain.StatusAll && permission.Status != status {
			continue
		}
		if permissionType != "" && permissionType != domain.StatusAll && permission.Type != permissionType {
			continue
		}
		matched = append(matched, permission)
	}

	textFilter := id != "" || name != "" || path != "" ||
		(permissionType != "" && permissionType != domain.StatusAll)
	selected := matched
	if textFilter {
		ids := permissionIndex(all).WithAncestorIDs(matched)
		selected = make([]store.Permission, 0, len(ids))
		for _, permission := range all {
			if ids[permission.ID] {
				selected = append(selected, permission)
			}
		}
	}
	result := make([]PermissionBean, 0, len(selected))
	for _, permission := range selected {
		result = append(result, permissionBean(permission))
	}
	return result, nil
}

func (s *Service) GetPermission(ctx context.Context, id string) (*PermissionBean, error) {
	permission, err := s.store.FindPermission(ctx, id)
	if err != nil {
		return nil, err
	}
	if permission == nil {
		return nil, domain.NotFound("权限不存在")
	}
	bean := permissionBean(*permission)
	return &bean, nil
}

func (s *Service) AddPermission(ctx context.Context, id, name string, path string, action *string, permissionType string, parentID *string) (*PermissionBean, error) {
	parent := trimPointer(parentID)
	normalizedAction := domain.NormalizeAction(action)
	normalizedPath, err := requirePath(path)
	if err != nil {
		return nil, err
	}
	if err := domain.PermissionCodePolicy.Validate(id, deref(parent)); err != nil {
		return nil, err
	}
	if err := domain.ValidatePermissionShape(permissionType, normalizedAction); err != nil {
		return nil, err
	}
	exists, err := s.store.PermissionExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.Conflict("权限编码已存在")
	}
	if parent != nil {
		parentPermission, err := s.store.FindPermission(ctx, *parent)
		if err != nil {
			return nil, err
		}
		if parentPermission == nil {
			return nil, domain.NotFound("父权限不存在")
		}
		if parentPermission.Type == domain.PermissionTypeAction {
			return nil, domain.Validation("动作权限不能添加子节点")
		}
	}
	if err := s.assertUniquePermission(ctx, permissionType, normalizedPath, normalizedAction, ""); err != nil {
		return nil, err
	}
	now := time.Now()
	permission := store.Permission{
		ID:         id,
		Name:       name,
		Path:       normalizedPath,
		Action:     normalizedAction,
		Type:       permissionType,
		Status:     domain.StatusEnabled,
		ParentID:   parent,
		CreateTime: &now,
		UpdateTime: &now,
	}
	if err := s.store.CreatePermission(ctx, &permission); err != nil {
		return nil, err
	}
	bean := permissionBean(permission)
	return &bean, nil
}

type PermissionUpdate struct {
	Name   *string
	Path   *string
	Action *string
	Type   *string
	Status *string
}

func (s *Service) UpdatePermission(ctx context.Context, id string, update PermissionUpdate) error {
	permission, err := s.store.FindPermission(ctx, id)
	if err != nil {
		return err
	}
	if permission == nil {
		return domain.NotFound("权限不存在")
	}

	effectiveType := permission.Type
	if update.Type != nil {
		effectiveType = *update.Type
	}
	effectivePath, err := requirePath(permission.Path)
	if err != nil {
		return err
	}
	if update.Path != nil {
		effectivePath, err = requirePath(*update.Path)
		if err != nil {
			return err
		}
	}
	effectiveAction := domain.NormalizeAction(permission.Action)
	if update.Action != nil {
		effectiveAction = domain.NormalizeAction(update.Action)
	}
	if err := s.assertUniquePermission(ctx, effectiveType, effectivePath, effectiveAction, id); err != nil {
		return err
	}

	if update.Name != nil {
		permission.Name = *update.Name
	}
	if update.Path != nil {
		permission.Path = effectivePath
	}
	if update.Action != nil {
		permission.Action = effectiveAction
	}
	if update.Type != nil {
		permission.Type = effectiveType
	}
	if update.Status != nil {
		if permission.Status != domain.StatusDisabled && *update.Status == domain.StatusDisabled {
			if err := s.assertNoEnabledPermissionDescendants(ctx, permission.ID); err != nil {
				return err
			}
		}
		permission.Status = *update.Status
	}
	now := time.Now()
	permission.UpdateTime = &now
	return s.store.SavePermission(ctx, permission)
}

func (s *Service) DeletePermissions(ctx context.Context, ids []string) error {
	requested := dedupeStrings(ids)
	if len(requested) == 0 {
		return domain.Validation("权限ID列表不能为空")
	}
	all, err := s.store.AllPermissions(ctx)
	if err != nil {
		return err
	}
	index := permissionIndex(all)
	for _, id := range requested {
		if _, ok := index.Get(id); !ok {
			return domain.NotFound("权限不存在")
		}
	}
	subtree := index.SubtreeIDs(requested)
	subtreeIDs := keysOf(subtree)
	roleRefs, err := s.store.ExistsRolePermissionIn(ctx, subtreeIDs)
	if err != nil {
		return err
	}
	if roleRefs {
		return domain.Conflict("权限已被角色引用，不能删除")
	}
	userRefs, err := s.store.ExistsUserPermissionIn(ctx, subtreeIDs)
	if err != nil {
		return err
	}
	if userRefs {
		return domain.Conflict("权限已被用户引用，不能删除")
	}
	return s.store.DeletePermissionsInOrder(ctx, index.DeleteOrder(subtree))
}

func (s *Service) assertUniquePermission(ctx context.Context, permissionType, path string, action *string, excludeID string) error {
	if err := domain.ValidatePermissionShape(permissionType, action); err != nil {
		return err
	}
	exists, err := s.store.PermissionIdentityExists(ctx, permissionType, path, action, excludeID)
	if err != nil {
		return err
	}
	if exists {
		return domain.Conflict("权限已存在")
	}
	return nil
}

func (s *Service) assertNoEnabledPermissionDescendants(ctx context.Context, id string) error {
	all, err := s.store.AllPermissions(ctx)
	if err != nil {
		return err
	}
	enabled := func(permission store.Permission) bool { return permission.Status == domain.StatusEnabled }
	if permissionIndex(all).HasEnabledDescendant(id, enabled) {
		return domain.Validation("请先禁用子权限")
	}
	return nil
}

func requirePath(path string) (string, error) {
	normalized := strings.TrimSpace(path)
	if normalized == "" {
		return "", domain.Validation("权限路径不能为空")
	}
	return normalized, nil
}
