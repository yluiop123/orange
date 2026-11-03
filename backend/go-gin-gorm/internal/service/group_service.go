package service

import (
	"context"
	"sort"
	"strings"
	"time"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type GroupBean struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Status     string  `json:"status"`
	ParentID   *string `json:"parentId"`
	CreateTime *string `json:"createTime"`
	UpdateTime *string `json:"updateTime"`
}

func groupBean(group store.Group) GroupBean {
	return GroupBean{
		ID:         group.ID,
		Name:       group.Name,
		Status:     group.Status,
		ParentID:   group.ParentID,
		CreateTime: beanTime(group.CreateTime),
		UpdateTime: beanTime(group.UpdateTime),
	}
}

func groupIndex(groups []store.Group) *domain.TreeIndex[store.Group] {
	return domain.NewTreeIndex(groups,
		func(group store.Group) string { return group.ID },
		func(group store.Group) *string { return group.ParentID },
	)
}

func (s *Service) ListGroups(ctx context.Context, id, name, status string) ([]GroupBean, error) {
	all, err := s.store.AllGroups(ctx)
	if err != nil {
		return nil, err
	}
	matched := make([]store.Group, 0, len(all))
	for _, group := range all {
		if id != "" && !hasPrefixFold(group.ID, id) {
			continue
		}
		if name != "" && !hasPrefixFold(group.Name, name) {
			continue
		}
		if status != "" && status != domain.StatusAll && group.Status != status {
			continue
		}
		matched = append(matched, group)
	}

	textFilter := id != "" || name != ""
	if !textFilter {
		return beansOf(all, matched), nil
	}
	// Text filters also return ancestors so the client can rebuild the tree.
	ids := groupIndex(all).WithAncestorIDs(matched)
	result := make([]GroupBean, 0, len(ids))
	for _, group := range all {
		if ids[group.ID] {
			result = append(result, groupBean(group))
		}
	}
	return result, nil
}

func beansOf(all, matched []store.Group) []GroupBean {
	selected := make(map[string]bool, len(matched))
	for _, group := range matched {
		selected[group.ID] = true
	}
	result := make([]GroupBean, 0, len(matched))
	for _, group := range all {
		if selected[group.ID] {
			result = append(result, groupBean(group))
		}
	}
	return result
}

func (s *Service) GetGroup(ctx context.Context, id string) (*GroupBean, error) {
	if strings.TrimSpace(id) == "" {
		return &GroupBean{}, nil
	}
	group, err := s.store.FindGroup(ctx, id)
	if err != nil {
		return nil, err
	}
	if group == nil {
		return nil, domain.NotFound("组织不存在")
	}
	bean := groupBean(*group)
	return &bean, nil
}

func (s *Service) AddGroup(ctx context.Context, id, name string, parentID *string) (*GroupBean, error) {
	parent := trimPointer(parentID)
	if err := domain.GroupCodePolicy.Validate(id, deref(parent)); err != nil {
		return nil, err
	}
	exists, err := s.store.GroupExists(ctx, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.Conflict("组织编码已存在")
	}
	if parent != nil {
		exists, err := s.store.GroupExists(ctx, *parent)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, domain.NotFound("父组织不存在")
		}
	}
	now := time.Now()
	group := store.Group{
		ID:         id,
		Name:       name,
		Status:     domain.StatusEnabled,
		ParentID:   parent,
		CreateTime: &now,
		UpdateTime: &now,
		Version:    0,
	}
	if err := s.store.CreateGroup(ctx, &group); err != nil {
		return nil, err
	}
	bean := groupBean(group)
	return &bean, nil
}

func (s *Service) UpdateGroup(ctx context.Context, id, name string, status *string) error {
	group, err := s.store.FindGroup(ctx, id)
	if err != nil {
		return err
	}
	if group == nil {
		return domain.NotFound("组织不存在")
	}
	if name != "" {
		group.Name = name
	}
	if status != nil {
		if group.Status != domain.StatusDisabled && *status == domain.StatusDisabled {
			if err := s.assertNoEnabledGroupDescendants(ctx, group.ID); err != nil {
				return err
			}
		}
		group.Status = *status
	}
	now := time.Now()
	group.UpdateTime = &now
	return s.store.SaveGroup(ctx, group)
}

func (s *Service) assertNoEnabledGroupDescendants(ctx context.Context, id string) error {
	all, err := s.store.AllGroups(ctx)
	if err != nil {
		return err
	}
	enabled := func(group store.Group) bool { return group.Status == domain.StatusEnabled }
	if groupIndex(all).HasEnabledDescendant(id, enabled) {
		return domain.Validation("请先禁用子组织")
	}
	return nil
}

func (s *Service) DeleteGroups(ctx context.Context, ids []string) error {
	requested := dedupeStrings(ids)
	if len(requested) == 0 {
		return domain.Validation("组织ID列表不能为空")
	}
	all, err := s.store.AllGroups(ctx)
	if err != nil {
		return err
	}
	index := groupIndex(all)
	for _, id := range requested {
		if _, ok := index.Get(id); !ok {
			return domain.NotFound("组织不存在")
		}
	}
	subtree := index.SubtreeIDs(requested)
	subtreeIDs := keysOf(subtree)
	hasUsers, err := s.store.ExistsUserInGroupIDs(ctx, subtreeIDs)
	if err != nil {
		return err
	}
	if hasUsers {
		return domain.Conflict("组织或其子组织下有用户，不能删除")
	}
	return s.store.DeleteGroupsInOrder(ctx, index.DeleteOrder(subtree))
}

func hasPrefixFold(value, prefix string) bool {
	return strings.HasPrefix(strings.ToLower(value), strings.ToLower(strings.TrimSpace(prefix)))
}

func trimPointer(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func deref(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func dedupeStrings(values []string) []string {
	seen := make(map[string]bool, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" && !seen[trimmed] {
			seen[trimmed] = true
			result = append(result, trimmed)
		}
	}
	return result
}

func keysOf(values map[string]bool) []string {
	result := make([]string, 0, len(values))
	for value := range values {
		result = append(result, value)
	}
	sort.Strings(result)
	return result
}
