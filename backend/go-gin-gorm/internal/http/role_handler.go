package http

import (
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/service"
)

type addRoleRequest struct {
	ID          *string  `json:"id"`
	Name        string   `json:"name" binding:"required"`
	Permissions []string `json:"permissions"`
}

type editRoleRequest struct {
	Name        *string   `json:"name"`
	Status      *string   `json:"status"`
	Permissions *[]string `json:"permissions"`
}

func (h *Handlers) listRoles(c *gin.Context) {
	page, pageErr := intQuery(c, "page", 1)
	if pageErr != nil {
		fail(c, pageErr)
		return
	}
	size, sizeErr := intQuery(c, "size", 10)
	if sizeErr != nil {
		fail(c, sizeErr)
		return
	}
	if err := validatePage(page, size, 10000); err != nil {
		fail(c, err)
		return
	}
	direction := c.Query("direction")
	if err := validateDirection(direction); err != nil {
		fail(c, err)
		return
	}
	result, err := h.svc.ListRoles(c.Request.Context(), service.RoleListQuery{
		ID:        c.Query("id"),
		Name:      c.Query("name"),
		Status:    c.Query("status"),
		Sort:      c.Query("sort"),
		Direction: direction,
		Page:      page,
		Size:      size,
	})
	if err != nil {
		fail(c, err)
		return
	}
	success(c, result)
}

func (h *Handlers) getRole(c *gin.Context) {
	role, err := h.svc.GetRole(c.Request.Context(), c.Param("roleId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, role)
}

func (h *Handlers) addRole(c *gin.Context) {
	var request addRoleRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if length := utf8.RuneCountInString(request.Name); length < 2 || length > 50 {
		fail(c, fieldError("name", "角色名称长度需在 2-50 之间"))
		return
	}
	if request.ID != nil && *request.ID != "" {
		if err := validateRoleID(*request.ID); err != nil {
			fail(c, err)
			return
		}
	}
	id, err := h.svc.AddRole(c.Request.Context(), actorOf(c), request.ID, request.Name, request.Permissions)
	if err != nil {
		fail(c, err)
		return
	}
	successMessage(c, "操作成功", id)
}

func (h *Handlers) updateRole(c *gin.Context) {
	var request editRoleRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if request.Name != nil {
		if length := utf8.RuneCountInString(*request.Name); length < 2 || length > 50 {
			fail(c, fieldError("name", "角色名称长度需在 2-50 之间"))
			return
		}
	}
	if request.Status != nil {
		if err := validateStatus(*request.Status); err != nil {
			fail(c, err)
			return
		}
	}
	err := h.svc.UpdateRole(c.Request.Context(), actorOf(c), c.Param("roleId"), service.RoleUpdate{
		Name:        request.Name,
		Status:      request.Status,
		Permissions: request.Permissions,
	})
	if err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) deleteRole(c *gin.Context) {
	if err := h.svc.DeleteRoles(c.Request.Context(), []string{c.Param("roleId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) deleteRoleIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, fieldError("ids", "角色ID列表不能为空"))
		return
	}
	if err := h.svc.DeleteRoles(c.Request.Context(), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}
