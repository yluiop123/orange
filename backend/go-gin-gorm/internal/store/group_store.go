package store

import (
	"context"

	"gorm.io/gorm"
)

func (s *Store) AllGroups(ctx context.Context) ([]Group, error) {
	var groups []Group
	err := s.db.WithContext(ctx).Order("id").Find(&groups).Error
	return groups, err
}

func (s *Store) FindGroup(ctx context.Context, id string) (*Group, error) {
	var group Group
	if err := s.db.WithContext(ctx).Where("id = ?", id).First(&group).Error; err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}

func (s *Store) GroupExists(ctx context.Context, id string) (bool, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&Group{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

func (s *Store) CreateGroup(ctx context.Context, group *Group) error {
	return s.db.WithContext(ctx).Create(group).Error
}

func (s *Store) SaveGroup(ctx context.Context, group *Group) error {
	return s.db.WithContext(ctx).Save(group).Error
}

func (s *Store) DeleteGroupsInOrder(ctx context.Context, groups []Group) error {
	return s.transaction(ctx, func(tx *gorm.DB) error {
		for _, group := range groups {
			if err := tx.Where("id = ?", group.ID).Delete(&Group{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) ExistsUserInGroupIDs(ctx context.Context, ids []string) (bool, error) {
	if len(ids) == 0 {
		return false, nil
	}
	var count int64
	err := s.db.WithContext(ctx).Model(&User{}).Where("group_id IN ?", ids).Count(&count).Error
	return count > 0, err
}
