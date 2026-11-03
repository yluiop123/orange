package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type UserBean struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Username    string         `json:"username"`
	Email       *string        `json:"email"`
	GroupID     *string        `json:"groupId"`
	GroupName   string         `json:"groupName"`
	Phone       *string        `json:"phone"`
	Status      string         `json:"status"`
	CreateTime  *string        `json:"createTime"`
	UpdateTime  *string        `json:"updateTime"`
	Roles       []UserRoleBean `json:"roles"`
	Permissions []string       `json:"permissions"`
}

type UserRoleBean struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type UserListQuery struct {
	Keyword   string
	Status    string
	GroupID   string
	Sort      string
	Direction string
	Page      int
	Size      int
}

var userSortColumns = map[string]string{
	"id":         "id",
	"name":       "name",
	"username":   "username",
	"email":      "email",
	"status":     "status",
	"createTime": "create_time",
	"updateTime": "update_time",
}

func (s *Service) ListUsers(ctx context.Context, query UserListQuery) (*PageData[UserBean], error) {
	column, explicit := userSortColumns[query.Sort]
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
	total, users, err := s.store.ListUsers(ctx, store.UserListFilter{
		Keyword:   query.Keyword,
		Status:    query.Status,
		GroupID:   query.GroupID,
		SortBy:    column,
		Direction: direction,
		Page:      query.Page,
		Size:      query.Size,
	})
	if err != nil {
		return nil, err
	}
	groupNames, err := s.store.GroupNames(ctx)
	if err != nil {
		return nil, err
	}
	beans := make([]UserBean, 0, len(users))
	for _, user := range users {
		beans = append(beans, simpleUserBean(user, groupNames[deref(user.GroupID)]))
	}
	page := newPageData(total, beans, query.Page, query.Size)
	return &page, nil
}

func simpleUserBean(user store.User, groupName string) UserBean {
	return UserBean{
		ID:          user.ID,
		Name:        user.Name,
		Username:    user.Username,
		Email:       user.Email,
		GroupID:     user.GroupID,
		GroupName:   groupName,
		Phone:       user.Phone,
		Status:      user.Status,
		CreateTime:  beanTime(user.CreateTime),
		UpdateTime:  beanTime(user.UpdateTime),
		Roles:       make([]UserRoleBean, 0),
		Permissions: make([]string, 0),
	}
}

func (s *Service) GetUser(ctx context.Context, id string) (*UserBean, error) {
	user, err := s.store.FindUserByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, domain.NotFound("用户不存在")
	}
	groupName := ""
	if user.GroupID != nil {
		group, err := s.store.FindGroup(ctx, *user.GroupID)
		if err != nil {
			return nil, err
		}
		if group != nil {
			groupName = group.Name
		}
	}
	bean := simpleUserBean(*user, groupName)
	roles, err := s.store.RolesForUser(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	for _, role := range roles {
		bean.Roles = append(bean.Roles, UserRoleBean{ID: role.ID, Name: role.Name})
	}
	permissionIDs, err := s.store.DirectPermissionIDsForUser(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	bean.Permissions = append(bean.Permissions, permissionIDs...)
	return &bean, nil
}

type AddUserInput struct {
	Name        string
	Username    string
	Email       string
	GroupID     string
	Phone       string
	Status      *string
	Roles       []string
	Permissions []string
}

func (s *Service) AddUser(ctx context.Context, actor *auth.Principal, input AddUserInput) (string, error) {
	exists, err := s.store.UserExistsByUsername(ctx, input.Username)
	if err != nil {
		return "", err
	}
	if exists {
		return "", domain.Conflict("用户名已存在")
	}
	if err := s.assertCanAssignRoles(actor, input.Roles); err != nil {
		return "", err
	}
	if err := s.assertCanAssignPermissions(actor, input.Permissions); err != nil {
		return "", err
	}
	groupExists, err := s.store.GroupExists(ctx, input.GroupID)
	if err != nil {
		return "", err
	}
	if !groupExists {
		return "", domain.NotFound("组织不存在")
	}
	roleIDs, err := s.filterExistingRoleIDs(ctx, input.Roles)
	if err != nil {
		return "", err
	}
	permissionIDs, err := s.filterExistingPermissionIDs(ctx, input.Permissions)
	if err != nil {
		return "", err
	}

	tempPassword, err := auth.GenerateTemporaryPassword()
	if err != nil {
		return "", err
	}
	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		return "", err
	}
	status := domain.StatusEnabled
	if input.Status != nil {
		status = *input.Status
	}
	now := time.Now()
	groupID := input.GroupID
	email := input.Email
	phone := input.Phone
	user := store.User{
		ID:                 uuid.NewString(),
		Name:               input.Name,
		Username:           input.Username,
		Email:              &email,
		GroupID:            &groupID,
		Phone:              &phone,
		Status:             status,
		Password:           &hash,
		MustChangePassword: true,
		CreateTime:         &now,
		UpdateTime:         &now,
	}
	if err := s.store.CreateUser(ctx, &user, roleIDs, permissionIDs); err != nil {
		return "", err
	}
	return tempPassword, nil
}

type UserUpdate struct {
	Name        *string
	Username    *string
	Email       *string
	GroupID     *string
	Phone       *string
	Status      *string
	Roles       *[]string
	Permissions *[]string
}

func (s *Service) UpdateUser(ctx context.Context, actor *auth.Principal, id string, update UserUpdate) error {
	user, err := s.store.FindUserByID(ctx, id)
	if err != nil {
		return err
	}
	if user == nil {
		return domain.NotFound("用户不存在")
	}
	if update.Username != nil && *update.Username != user.Username {
		return domain.Validation("用户名创建后不可修改")
	}
	if update.Name != nil {
		user.Name = *update.Name
	}
	if update.Email != nil {
		user.Email = update.Email
	}
	if update.Phone != nil {
		user.Phone = update.Phone
	}
	if update.GroupID != nil {
		groupID := strings.TrimSpace(*update.GroupID)
		if groupID == "" {
			return domain.NotFound("组织不存在")
		}
		exists, err := s.store.GroupExists(ctx, groupID)
		if err != nil {
			return err
		}
		if !exists {
			return domain.NotFound("组织不存在")
		}
		user.GroupID = &groupID
	}
	if update.Status != nil {
		disabling := user.Status != domain.StatusDisabled && *update.Status == domain.StatusDisabled
		if disabling {
			if err := s.assertNotSelf(actor, user.ID, "禁用"); err != nil {
				return err
			}
			if err := s.assertNotLastSuper(ctx, user, "禁用"); err != nil {
				return err
			}
			user.TokenVersion++
		}
		user.Status = *update.Status
	}

	var roleIDs []string
	var permissionIDs []string
	if update.Roles != nil {
		if err := s.assertCanAssignRoles(actor, *update.Roles); err != nil {
			return err
		}
		roleIDs, err = s.filterExistingRoleIDs(ctx, *update.Roles)
		if err != nil {
			return err
		}
	}
	if update.Permissions != nil {
		if err := s.assertCanAssignPermissions(actor, *update.Permissions); err != nil {
			return err
		}
		permissionIDs, err = s.filterExistingPermissionIDs(ctx, *update.Permissions)
		if err != nil {
			return err
		}
	}

	now := time.Now()
	user.UpdateTime = &now
	if err := s.store.SaveUser(ctx, user); err != nil {
		return err
	}
	if update.Roles != nil {
		if err := s.store.ReplaceUserRoles(ctx, user.ID, roleIDs); err != nil {
			return err
		}
	}
	if update.Permissions != nil {
		if err := s.store.ReplaceUserPermissions(ctx, user.ID, permissionIDs); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, actor *auth.Principal, id string) (string, error) {
	user, err := s.store.FindUserByID(ctx, id)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", domain.NotFound("用户不存在")
	}
	roles, err := s.store.RolesForUser(ctx, user.ID)
	if err != nil {
		return "", err
	}
	if hasRole(roles, "super") && !actor.IsSuper() {
		return "", domain.Validation("无权重置超级管理员密码")
	}
	tempPassword, err := auth.GenerateTemporaryPassword()
	if err != nil {
		return "", err
	}
	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		return "", err
	}
	user.Password = &hash
	user.MustChangePassword = true
	// A reset invalidates all tokens issued with the old password.
	user.TokenVersion++
	now := time.Now()
	user.UpdateTime = &now
	if err := s.store.SaveUser(ctx, user); err != nil {
		return "", err
	}
	logIgnore("clear login attempt", s.store.DeleteLoginAttempt(ctx, "user:"+strings.ToLower(user.Username)))
	return tempPassword, nil
}

func (s *Service) DeleteUsers(ctx context.Context, actor *auth.Principal, ids []string) error {
	requested := dedupeStrings(ids)
	users, err := s.store.UsersByIDs(ctx, requested)
	if err != nil {
		return err
	}
	if len(users) == 0 {
		return domain.NotFound("用户不存在")
	}
	enabledSupers, err := s.store.CountEnabledSuperUsers(ctx)
	if err != nil {
		return err
	}
	deletingSupers := int64(0)
	for i := range users {
		user := &users[i]
		if err := s.assertNotSelf(actor, user.ID, "删除"); err != nil {
			return err
		}
		if user.Status == domain.StatusDisabled {
			continue
		}
		roles, err := s.store.RolesForUser(ctx, user.ID)
		if err != nil {
			return err
		}
		if hasRole(roles, "super") {
			deletingSupers++
		}
	}
	if deletingSupers > 0 && enabledSupers-deletingSupers < 1 {
		return domain.Validation("系统至少需要保留一个启用的超级管理员")
	}
	userIDs := make([]string, 0, len(users))
	for _, user := range users {
		userIDs = append(userIDs, user.ID)
	}
	return s.store.DeleteUsers(ctx, userIDs)
}

func (s *Service) assertNotSelf(actor *auth.Principal, targetID, action string) error {
	if actor != nil && actor.UserID == targetID {
		return domain.Validation("不能" + action + "当前登录用户")
	}
	return nil
}

func (s *Service) assertNotLastSuper(ctx context.Context, user *store.User, action string) error {
	if user.Status == domain.StatusDisabled {
		return nil
	}
	roles, err := s.store.RolesForUser(ctx, user.ID)
	if err != nil {
		return err
	}
	if !hasRole(roles, "super") {
		return nil
	}
	enabledSupers, err := s.store.CountEnabledSuperUsers(ctx)
	if err != nil {
		return err
	}
	if enabledSupers <= 1 {
		return domain.Validation("系统至少需要保留一个启用的超级管理员，不能" + action)
	}
	return nil
}
