package service

import (
	"context"
	"strings"
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type LoginResult struct {
	Token            string  `json:"token"`
	Status           string  `json:"status"`
	Field            *string `json:"field"`
	Msg              *string `json:"msg"`
	ExpiresIn        int64   `json:"expiresIn"`
	RefreshExpiresIn int64   `json:"refreshExpiresIn"`
	RefreshToken     string  `json:"-"`
}

func (s *Service) Login(ctx context.Context, username, password, ip string) (*LoginResult, error) {
	userKey := "user:" + strings.ToLower(strings.TrimSpace(username))
	ipKey := "ip:" + strings.TrimSpace(ip)

	blocked, err := s.isBlocked(ctx, userKey, ipKey)
	if err != nil {
		return nil, err
	}
	if blocked {
		return nil, domain.TooManyRequests("登录失败次数过多，请稍后再试")
	}

	user, err := s.store.FindUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	valid := user != nil && user.Status != domain.StatusDisabled && user.Password != nil &&
		auth.CheckPassword(*user.Password, password)
	if !valid {
		s.recordFailure(ctx, userKey, s.userLockout)
		s.recordFailure(ctx, ipKey, s.ipLockout)
		return nil, domain.Unauthorized("用户名或密码错误")
	}

	// Only the account counter is cleared; a successful login must not reset
	// the IP counter for an attacker.
	logIgnore("clear login attempt", s.store.DeleteLoginAttempt(ctx, userKey))
	tokens, err := s.issueTokens(user)
	if err != nil {
		return nil, err
	}
	return tokens, nil
}

func (s *Service) isBlocked(ctx context.Context, keys ...string) (bool, error) {
	now := time.Now()
	for _, key := range keys {
		attempt, err := s.store.FindLoginAttempt(ctx, key)
		if err != nil {
			return false, err
		}
		state := stateOf(attempt)
		policy := s.userLockout
		if strings.HasPrefix(key, "ip:") {
			policy = s.ipLockout
		}
		if policy.IsLocked(state, now) {
			return true, nil
		}
	}
	return false, nil
}

func stateOf(attempt *store.LoginAttempt) *domain.LockoutState {
	if attempt == nil {
		return nil
	}
	return &domain.LockoutState{
		Failures:    attempt.Failures,
		WindowStart: attempt.WindowStart,
		LockedUntil: attempt.LockedUntil,
	}
}

func (s *Service) recordFailure(ctx context.Context, key string, policy domain.LockoutPolicy) {
	now := time.Now()
	err := s.store.WithLockedAttempt(ctx, key, func(attempt *store.LoginAttempt) error {
		result := policy.OnFailure(stateOf(attempt), now)
		attempt.Failures = result.Failures
		attempt.WindowStart = result.WindowStart
		attempt.LockedUntil = result.LockedUntil
		attempt.UpdateTime = now
		return nil
	})
	logIgnore("record login failure", err)
}

func (s *Service) issueTokens(user *store.User) (*LoginResult, error) {
	access, err := s.tokens.IssueAccess(user.ID, user.Username, user.TokenVersion)
	if err != nil {
		return nil, err
	}
	refresh, err := s.tokens.IssueRefresh(user.ID, user.Username, user.TokenVersion)
	if err != nil {
		return nil, err
	}
	return &LoginResult{
		Token:            access.Value,
		Status:           "ok",
		ExpiresIn:        int64(s.tokens.AccessTTL().Seconds()),
		RefreshExpiresIn: int64(s.tokens.RefreshTTL().Seconds()),
		RefreshToken:     refresh.Value,
	}, nil
}

// RefreshToken issues the rotating pair from a valid refresh cookie.
func (s *Service) RefreshToken(ctx context.Context, rawRefresh string) (*LoginResult, error) {
	claims, err := s.tokens.Parse(rawRefresh, auth.TokenTypeRefresh)
	if err != nil {
		return nil, domain.Unauthorized("登录已过期")
	}
	revoked, err := s.store.IsTokenRevoked(ctx, claims.ID)
	if err != nil {
		return nil, err
	}
	if revoked {
		return nil, domain.Unauthorized("登录已过期")
	}

	user, err := s.userFromClaims(ctx, claims)
	if err != nil {
		return nil, err
	}
	if user == nil || user.Status == domain.StatusDisabled ||
		user.TokenVersion != claims.Version || user.Username != claims.Username {
		return nil, domain.Unauthorized("登录已过期")
	}

	// Rotation: the old refresh jti is revoked atomically-ish. A replay of the
	// same cookie loses the insert race and is rejected.
	inserted, err := s.store.RevokeToken(ctx, claims.ID, auth.TokenTypeRefresh, expirationOf(claims))
	if err != nil {
		return nil, err
	}
	if !inserted {
		return nil, domain.Unauthorized("登录已过期")
	}

	return s.issueTokens(user)
}

func (s *Service) userFromClaims(ctx context.Context, claims *auth.Claims) (*store.User, error) {
	if claims.Username != "" {
		user, err := s.store.FindUserByUsername(ctx, claims.Username)
		if err != nil {
			return nil, err
		}
		if user != nil && user.ID != claims.Subject {
			return nil, nil
		}
		return user, nil
	}
	return s.store.FindUserByID(ctx, claims.Subject)
}

func (s *Service) Logout(ctx context.Context, rawRefresh string, access *auth.Claims) {
	username := ""
	if rawRefresh != "" {
		if claims, err := s.tokens.Parse(rawRefresh, auth.TokenTypeRefresh); err == nil {
			_, _ = s.store.RevokeToken(ctx, claims.ID, auth.TokenTypeRefresh, expirationOf(claims))
			username = claims.Username
		}
	}
	if access != nil {
		_, _ = s.store.RevokeToken(ctx, access.ID, auth.TokenTypeAccess, expirationOf(access))
		if username == "" {
			username = access.Username
		}
	}
	// The reference implementation also bumps token_version on logout, which
	// invalidates every other session for the user.
	if username != "" {
		if user, err := s.store.FindUserByUsername(ctx, username); err == nil && user != nil {
			user.TokenVersion++
			logIgnore("bump token version on logout", s.store.SaveUser(ctx, user))
		}
	}
}

func expirationOf(claims *auth.Claims) time.Time {
	if claims == nil || claims.ExpiresAt == nil {
		return time.Now()
	}
	return claims.ExpiresAt.Time
}

func (s *Service) ChangePassword(ctx context.Context, username, oldPassword, newPassword string) error {
	user, err := s.store.FindUserByUsername(ctx, username)
	if err != nil {
		return err
	}
	if user == nil {
		return domain.NotFound("用户不存在")
	}
	if user.Password == nil || !auth.CheckPassword(*user.Password, oldPassword) {
		return domain.Validation("原密码错误")
	}
	if auth.CheckPassword(*user.Password, newPassword) {
		return domain.Validation("新密码不能与原密码相同")
	}
	hash, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}
	user.Password = &hash
	user.MustChangePassword = false
	// Changing the password invalidates every existing session.
	user.TokenVersion++
	if err := s.store.SaveUser(ctx, user); err != nil {
		return err
	}
	logIgnore("clear login attempt", s.store.DeleteLoginAttempt(ctx, "user:"+strings.ToLower(user.Username)))
	return nil
}

type UserInfo struct {
	ID                 string           `json:"id"`
	Name               string           `json:"name"`
	Username           string           `json:"username"`
	Email              *string          `json:"email"`
	GroupID            *string          `json:"groupId"`
	GroupName          string           `json:"groupName"`
	Phone              *string          `json:"phone"`
	Status             string           `json:"status"`
	MustChangePassword bool             `json:"mustChangePassword"`
	CreateTime         *string          `json:"createTime"`
	UpdateTime         *string          `json:"updateTime"`
	Roles              []RoleInfo       `json:"roles"`
	RolePermissions    []PermissionInfo `json:"rolePermissions"`
	UserPermissions    []PermissionInfo `json:"userPermissions"`
}

type RoleInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type PermissionInfo struct {
	Role   *string `json:"role"`
	Type   string  `json:"type"`
	Path   string  `json:"path"`
	Action *string `json:"action"`
}

func (s *Service) UserInfo(ctx context.Context, username string) (*UserInfo, error) {
	user, err := s.store.FindUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, domain.NotFound("用户不存在")
	}
	effective, err := s.effectiveFor(ctx, user)
	if err != nil {
		return nil, err
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

	info := &UserInfo{
		ID:                 user.ID,
		Name:               user.Name,
		Username:           user.Username,
		Email:              user.Email,
		GroupID:            user.GroupID,
		GroupName:          groupName,
		Phone:              user.Phone,
		Status:             user.Status,
		MustChangePassword: user.MustChangePassword,
		CreateTime:         beanTime(user.CreateTime),
		UpdateTime:         beanTime(user.UpdateTime),
		Roles:              make([]RoleInfo, 0, len(effective.Roles)),
		RolePermissions:    make([]PermissionInfo, 0, len(effective.RolePermissions)),
		UserPermissions:    make([]PermissionInfo, 0, len(effective.DirectPermissions)),
	}
	for _, role := range effective.Roles {
		info.Roles = append(info.Roles, RoleInfo{ID: role.ID, Name: role.Name})
	}
	for _, item := range effective.RolePermissions {
		roleID := item.RoleID
		info.RolePermissions = append(info.RolePermissions, PermissionInfo{
			Role:   &roleID,
			Type:   item.Permission.Type,
			Path:   item.Permission.Path,
			Action: item.Permission.Action,
		})
	}
	for _, permission := range effective.DirectPermissions {
		info.UserPermissions = append(info.UserPermissions, PermissionInfo{
			Type:   permission.Type,
			Path:   permission.Path,
			Action: permission.Action,
		})
	}
	return info, nil
}

type MenuNode struct {
	ID       string      `json:"id"`
	Path     string      `json:"path"`
	Type     string      `json:"type"`
	Name     string      `json:"name"`
	Children []*MenuNode `json:"children"`
}

func (s *Service) Menus(ctx context.Context, locale string) ([]*MenuNode, error) {
	permissions, err := s.store.EnabledMenuPermissions(ctx)
	if err != nil {
		return nil, err
	}
	translations, err := s.store.AllPermissionTranslations(ctx)
	if err != nil {
		return nil, err
	}
	nodes := make(map[string]*MenuNode, len(permissions))
	for _, permission := range permissions {
		name := localizedPermissionName(locale, translations[permission.ID], permission.Name)
		nodes[permission.ID] = &MenuNode{
			ID:       permission.ID,
			Path:     permission.Path,
			Type:     permission.Type,
			Name:     name,
			Children: make([]*MenuNode, 0),
		}
	}
	roots := make([]*MenuNode, 0)
	for _, permission := range permissions {
		node := nodes[permission.ID]
		if permission.ParentID == nil || *permission.ParentID == "" {
			roots = append(roots, node)
			continue
		}
		if parent, ok := nodes[*permission.ParentID]; ok {
			parent.Children = append(parent.Children, node)
		}
		// A node whose parent is disabled or absent stays invisible, matching
		// the reference implementation instead of promoting it to a root.
	}
	return roots, nil
}
