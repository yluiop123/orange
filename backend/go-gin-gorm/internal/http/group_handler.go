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

// @Summary List groups
// @Description Returns the group tree, optionally filtered by id, name or status. Matching rows keep their ancestors.
// @Tags Groups
// @Produce json
// @Param id query string false "Group id prefix (digits and letters)"
// @Param name query string false "Group name prefix"
// @Param status query string false "Status filter: 0, 1 or all" Enums(0, 1, all)
// @Success 200 {object} Envelope{data=[]service.GroupBean}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Security BearerAuth
// @Router /system/groups [get]
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

// @Summary Get a group
// @Tags Groups
// @Produce json
// @Param groupId path string true "Group id"
// @Success 200 {object} Envelope{data=service.GroupBean}
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Security BearerAuth
// @Router /system/groups/{groupId} [get]
func (h *Handlers) getGroup(c *gin.Context) {
	group, err := h.svc.GetGroup(c.Request.Context(), c.Param("groupId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, group)
}

// @Summary Add a group
// @Description Creates a group under an optional parent group.
// @Tags Groups
// @Accept json
// @Produce json
// @Param request body addGroupRequest true "Group to create"
// @Success 200 {object} Envelope{data=service.GroupBean}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/groups/children [post]
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

// @Summary Update a group
// @Tags Groups
// @Accept json
// @Produce json
// @Param groupId path string true "Group id"
// @Param request body editGroupRequest true "Fields to update"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/groups/{groupId} [patch]
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

// @Summary Update group status
// @Tags Groups
// @Accept json
// @Produce json
// @Param groupId path string true "Group id"
// @Param request body statusRequest true "New status"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/groups/{groupId}/status [patch]
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

// @Summary Delete a group
// @Tags Groups
// @Produce json
// @Param groupId path string true "Group id"
// @Success 200 {object} Envelope{data=string}
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/groups/{groupId} [delete]
func (h *Handlers) deleteGroup(c *gin.Context) {
	if err := h.svc.DeleteGroups(c.Request.Context(), []string{c.Param("groupId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

// @Summary Delete groups
// @Tags Groups
// @Produce json
// @Param ids query string true "Comma-separated group ids"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/groups [delete]
func (h *Handlers) deleteGroupIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, domain.ParamError("ids 不能为空"))
		return
	}
	if err := h.svc.DeleteGroups(c.Request.Context(), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}
