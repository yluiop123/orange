package http

import (
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

var groupQueryIDPattern = regexp.MustCompile(`^$|^[A-Za-z0-9]+$`)

type addGroupRequest struct {
	ID       string  `json:"id" binding:"required"`
	Name     string  `json:"name" binding:"required"`
	ParentID *string `json:"parentId"`
}

type editGroupRequest struct {
	Name   string  `json:"name" binding:"required"`
	Status *string `json:"status"`
}

type statusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *Handlers) listGroups(c *gin.Context) {
	id := c.Query("id")
	name := c.Query("name")
	status := c.Query("status")
	if !groupQueryIDPattern.MatchString(id) {
		fail(c, fieldError("id", "只能包含数字和大小写字母"))
		return
	}
	if status != "" && status != domain.StatusAll && status != domain.StatusEnabled && status != domain.StatusDisabled {
		fail(c, fieldError("status", "状态只能是 0、1 或 all"))
		return
	}
	groups, err := h.svc.ListGroups(c.Request.Context(), id, name, status)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, groups)
}

func (h *Handlers) getGroup(c *gin.Context) {
	group, err := h.svc.GetGroup(c.Request.Context(), c.Param("groupId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, group)
}

func (h *Handlers) addGroup(c *gin.Context) {
	var request addGroupRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if !digitsAtLeastTwo.MatchString(request.ID) {
		fail(c, fieldError("id", "组织编码只能包含数字"))
		return
	}
	group, err := h.svc.AddGroup(c.Request.Context(), request.ID, request.Name, request.ParentID)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, group)
}

func (h *Handlers) updateGroup(c *gin.Context) {
	var request editGroupRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if request.Status != nil {
		if err := validateStatus(*request.Status); err != nil {
			fail(c, err)
			return
		}
	}
	if err := h.svc.UpdateGroup(c.Request.Context(), c.Param("groupId"), request.Name, request.Status); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) updateGroupStatus(c *gin.Context) {
	var request statusRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if err := validateStatus(request.Status); err != nil {
		fail(c, err)
		return
	}
	if err := h.svc.UpdateGroup(c.Request.Context(), c.Param("groupId"), "", &request.Status); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) deleteGroup(c *gin.Context) {
	if err := h.svc.DeleteGroups(c.Request.Context(), []string{c.Param("groupId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) deleteGroupIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, fieldError("ids", "组织ID列表不能为空"))
		return
	}
	if err := h.svc.DeleteGroups(c.Request.Context(), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}
