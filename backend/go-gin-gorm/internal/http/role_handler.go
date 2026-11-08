package http

import (
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
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

// @Summary List roles
// @Description Returns a paginated list of roles.
// @Tags Roles
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size (1-100)" default(10)
// @Param id query string false "Role id prefix"
// @Param name query string false "Role name prefix"
// @Param status query string false "Status filter: 0, 1 or all" Enums(0, 1, all)
// @Param sort query string false "Sort column" Enums(id, name, status, createTime, updateTime)
// @Param direction query string false "Sort direction" Enums(asc, desc)
// @Success 200 {object} Envelope{data=RolePageData}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Security BearerAuth
// @Router /system/roles [get]
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

// @Summary Get a role
// @Tags Roles
// @Produce json
// @Param roleId path string true "Role id"
// @Success 200 {object} Envelope{data=service.RoleBean}
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Security BearerAuth
// @Router /system/roles/{roleId} [get]
func (h *Handlers) getRole(c *gin.Context) {
	role, err := h.svc.GetRole(c.Request.Context(), c.Param("roleId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, role)
}

// @Summary Add a role
// @Description Creates a role and optionally assigns permissions. The response data is the role id.
// @Tags Roles
// @Accept json
// @Produce json
// @Param request body addRoleRequest true "Role to create"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/roles [post]
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

// @Summary Update a role
// @Tags Roles
// @Accept json
// @Produce json
// @Param roleId path string true "Role id"
// @Param request body editRoleRequest true "Fields to update"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Security BearerAuth
// @Router /system/roles/{roleId} [patch]
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

// @Summary Delete a role
// @Tags Roles
// @Produce json
// @Param roleId path string true "Role id"
// @Success 200 {object} Envelope{data=string}
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/roles/{roleId} [delete]
func (h *Handlers) deleteRole(c *gin.Context) {
	if err := h.svc.DeleteRoles(c.Request.Context(), actorOf(c), []string{c.Param("roleId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

// @Summary Delete roles
// @Tags Roles
// @Produce json
// @Param ids query string true "Comma-separated role ids"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/roles [delete]
func (h *Handlers) deleteRoleIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, domain.ParamError("ids 不能为空"))
		return
	}
	if err := h.svc.DeleteRoles(c.Request.Context(), actorOf(c), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}
