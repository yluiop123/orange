package service

import (
	"context"
	"log"
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/config"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

const beanTimeLayout = "2006-01-02 15:04:05-07:00"

// Service contains the business rules. It has no Gin or HTTP dependency so the
// policies can be exercised directly.
type Service struct {
	store       *store.Store
	tokens      *auth.TokenService
	userLockout domain.LockoutPolicy
	ipLockout   domain.LockoutPolicy
}

func New(st *store.Store, tokens *auth.TokenService, cfg config.Lockout) *Service {
	return &Service{
		store:       st,
		tokens:      tokens,
		userLockout: domain.NewLockoutPolicy(cfg.MaxAttempts, cfg.LockFor, cfg.LockFor),
		ipLockout:   domain.NewLockoutPolicy(cfg.IPMaxAttempts, cfg.LockFor, cfg.LockFor),
	}
}

func (s *Service) Tokens() *auth.TokenService { return s.tokens }

// LoadPrincipal rebuilds the caller from the database on every request. Only
// enabled roles and permissions survive.
func (s *Service) LoadPrincipal(ctx context.Context, username string) (*auth.Principal, error) {
	user, err := s.store.FindUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}
	effective, err := s.effectiveFor(ctx, user)
	if err != nil {
		return nil, err
	}
	return principalOf(user, effective), nil
}

func principalOf(user *store.User, effective domain.Effective) *auth.Principal {
	permissionIDs := make(map[string]bool, len(effective.Permissions))
	for _, permission := range effective.Permissions {
		permissionIDs[permission.ID] = true
	}
	return &auth.Principal{
		UserID:             user.ID,
		Username:           user.Username,
		TokenVersion:       user.TokenVersion,
		MustChangePassword: user.MustChangePassword,
		Enabled:            user.Status != domain.StatusDisabled,
		Effective: auth.EffectivePermissions{
			Authorities: effective.Authorities,
			Permissions: permissionIDs,
			Super:       effective.IsSuper(),
		},
	}
}

func (s *Service) effectiveFor(ctx context.Context, user *store.User) (domain.Effective, error) {
	roles, err := s.store.RolesForUser(ctx, user.ID)
	if err != nil {
		return domain.Effective{}, err
	}
	roleIDs := make([]string, 0, len(roles))
	for _, role := range roles {
		roleIDs = append(roleIDs, role.ID)
	}
	permissionsByRole, err := s.store.PermissionsForRoles(ctx, roleIDs)
	if err != nil {
		return domain.Effective{}, err
	}
	domainRoles := make([]domain.Role, 0, len(roles))
	for _, role := range roles {
		domainRoles = append(domainRoles, role.ToDomain(permissionsByRole[role.ID]))
	}
	direct, err := s.store.DirectPermissionsForUser(ctx, user.ID)
	if err != nil {
		return domain.Effective{}, err
	}
	directDomain := make([]domain.Permission, 0, len(direct))
	for _, permission := range direct {
		directDomain = append(directDomain, permission.ToDomain())
	}
	return domain.ComputeEffective(domainRoles, directDomain), nil
}

func (s *Service) assertCanAssignRoles(actor *auth.Principal, roleIDs []string) error {
	if len(roleIDs) == 0 {
		return nil
	}
	for _, roleID := range roleIDs {
		if roleID == "super" && !actor.IsSuper() {
			return domain.Validation("只有超级管理员可以授予 super 角色")
		}
	}
	return nil
}

func (s *Service) assertCanAssignPermissions(actor *auth.Principal, permissionIDs []string) error {
	for _, permissionID := range permissionIDs {
		if permissionID == "" {
			continue
		}
		if !actor.HasPermission(permissionID) {
			return domain.Validation("不能授予当前账号没有的权限")
		}
	}
	return nil
}

// filterExistingPermissionIDs mirrors JpaRepository.findAllById: unknown ids
// are silently dropped before writing join rows.
func (s *Service) filterExistingPermissionIDs(ctx context.Context, ids []string) ([]string, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	all, err := s.store.AllPermissions(ctx)
	if err != nil {
		return nil, err
	}
	existing := make(map[string]bool, len(all))
	for _, permission := range all {
		existing[permission.ID] = true
	}
	return keepExisting(ids, existing), nil
}

func (s *Service) filterExistingRoleIDs(ctx context.Context, ids []string) ([]string, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	roles, err := s.store.RolesByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	existing := make(map[string]bool, len(roles))
	for _, role := range roles {
		existing[role.ID] = true
	}
	return keepExisting(ids, existing), nil
}

func keepExisting(ids []string, existing map[string]bool) []string {
	seen := make(map[string]bool, len(ids))
	result := make([]string, 0, len(ids))
	for _, id := range ids {
		if existing[id] && !seen[id] {
			seen[id] = true
			result = append(result, id)
		}
	}
	return result
}

func beanTime(value *time.Time) *string {
	if value == nil {
		return nil
	}
	formatted := value.Format(beanTimeLayout)
	return &formatted
}

func isoTime(value time.Time) string { return value.Format(time.RFC3339Nano) }

func hasRole(roles []store.Role, roleID string) bool {
	for _, role := range roles {
		if role.ID == roleID {
			return true
		}
	}
	return false
}

func totalPages(total int64, size int) int {
	if total == 0 || size <= 0 {
		return 0
	}
	pages := int((total + int64(size) - 1) / int64(size))
	return pages
}

func logIgnore(operation string, err error) {
	if err != nil {
		log.Printf("%s: %v", operation, err)
	}
}
