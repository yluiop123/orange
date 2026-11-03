package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type RoleBean struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Status      string   `json:"status"`
	Permissions []string `json:"permissions"`
	CreateTime  *string  `json:"createTime"`
	UpdateTime  *string  `json:"updateTime"`
}

type RoleListQuery struct {
	ID        string
	Name      string
	Status    string
	Sort      string
	Direction string
	Page      int
	Size      int
}

var roleSortColumns = map[string]string{
	"id":         "id",
	"name":       "name",
	"status":     "status",
	"createTime": "create_time",
	"updateTime": "update_time",
}

func (s *Service) ListRoles(ctx context.Context, query RoleListQuery) (*PageData[RoleBean], error) {
	column, explicit := roleSortColumns[query.Sort]
	if !explicit {
		column = "create_time"
	}
	direction := query.Direction
	if direction == "" {
		if explicit {
			direction = "asc"
		} else {
			direction = "desc"
		}
	}
	total, roles, err := s.store.ListRoles(ctx, store.RoleListFilter{
		ID:        query.ID,
		Name:      query.Name,
		Status:    query.Status,
		SortBy:    column,
		Direction: direction,
		Page:      query.Page,
		Size:      query.Size,
	})
	if err != nil {
		return nil, err
	}
	beans := make([]RoleBean, 0, len(roles))
	for _, role := range roles {
		beans = append(beans, roleBean(role, nil))
	}
	page := newPageData(total, beans, query.Page, query.Size)
	return &page, nil
}

func roleBean(role store.Role, permissions []string) RoleBean {
	return RoleBean{
		ID:          role.ID,
		Name:        role.Name,
		Status:      role.Status,
		Permissions: permissions,
		CreateTime:  beanTime(role.CreateTime),
		UpdateTime:  beanTime(role.UpdateTime),
	}
}

func (s *Service) GetRole(ctx context.Context, id string) (*RoleBean, error) {
	role, err := s.store.FindRole(ctx, id)
	if err != nil {
		return nil, err
	}
	if role == nil {
		return nil, domain.NotFound("角色不存在")
	}
	permissions, err := s.store.PermissionsForRole(ctx, id)
	if err != nil {
		return nil, err
	}
	if permissions == nil {
		permissions = make([]string, 0)
	}
	bean := roleBean(*role, permissions)
	return &bean, nil
}

func (s *Service) AddRole(ctx context.Context, actor *auth.Principal, id *string, name string, permissions []string) (string, error) {
	roleID := ""
	if id != nil {
		roleID = *id
	}
	if roleID == "" {
		roleID = uuid.NewString()
	} else {
		exists, err := s.store.RoleExists(ctx, roleID)
		if err != nil {
			return "", err
		}
		if exists {
			return "", domain.Conflict("角色ID已存在")
		}
	}
	if err := s.assertCanAssignPermissions(actor, permissions); err != nil {
		return "", err
	}
	existing, err := s.filterExistingPermissionIDs(ctx, permissions)
	if err != nil {
		return "", err
	}
	now := time.Now()
	role := store.Role{
		ID:         roleID,
		Name:       name,
		Status:     domain.StatusEnabled,
		CreateTime: &now,
		UpdateTime: &now,
	}
	if err := s.store.CreateRole(ctx, &role, existing); err != nil {
		return "", err
	}
	return role.ID, nil
}

type RoleUpdate struct {
	Name        *string
	Status      *string
	Permissions *[]string
}

func (s *Service) UpdateRole(ctx context.Context, actor *auth.Principal, id string, update RoleUpdate) error {
	role, err := s.store.FindRole(ctx, id)
	if err != nil {
		return err
	}
	if role == nil {
		return domain.NotFound("角色不存在")
	}
	if update.Name != nil {
		role.Name = *update.Name
	}
	if update.Status != nil {
		role.Status = *update.Status
	}
	var existing []string
	if update.Permissions != nil {
		if err := s.assertCanAssignPermissions(actor, *update.Permissions); err != nil {
			return err
		}
		existing, err = s.filterExistingPermissionIDs(ctx, *update.Permissions)
		if err != nil {
			return err
		}
	}
	now := time.Now()
	role.UpdateTime = &now
	if err := s.store.SaveRole(ctx, role); err != nil {
		return err
	}
	if update.Permissions != nil {
		return s.store.ReplaceRolePermissions(ctx, role.ID, existing)
	}
	return nil
}

func (s *Service) DeleteRoles(ctx context.Context, ids []string) error {
	requested := dedupeStrings(ids)
	roles, err := s.store.RolesByIDs(ctx, requested)
	if err != nil {
		return err
	}
	if len(roles) == 0 {
		return domain.NotFound("角色不存在")
	}
	for _, role := range roles {
		referenced, err := s.store.ExistsUserWithRoleIDs(ctx, []string{role.ID})
		if err != nil {
			return err
		}
		if referenced {
			return domain.Conflict("角色" + role.ID + "已被用户引用，不能删除")
		}
	}
	roleIDs := make([]string, 0, len(roles))
	for _, role := range roles {
		roleIDs = append(roleIDs, role.ID)
	}
	return s.store.DeleteRoles(ctx, roleIDs)
}
