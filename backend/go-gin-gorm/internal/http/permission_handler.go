package http

import (
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/service"
)

type addPermissionRequest struct {
	ID       string  `json:"id" binding:"required"`
	Name     string  `json:"name" binding:"required"`
	Path     string  `json:"path" binding:"required"`
	Action   *string `json:"action"`
	Type     string  `json:"type" binding:"required"`
	ParentID *string `json:"parentId"`
}

type editPermissionRequest struct {
	Name   *string `json:"name"`
	Path   *string `json:"path"`
	Action *string `json:"action"`
	Status *string `json:"status"`
	Type   *string `json:"type"`
}

func validQueryPermissionType(value string) bool {
	switch value {
	case "", domain.StatusAll, domain.PermissionTypeMenu, domain.PermissionTypeAction, domain.PermissionTypeDirectory:
		return true
	default:
		return false
	}
}

func (h *Handlers) listPermissions(c *gin.Context) {
	status := c.Query("status")
	permissionType := c.Query("type")
	if status != "" && status != domain.StatusAll && status != domain.StatusEnabled && status != domain.StatusDisabled {
		fail(c, fieldError("status", "状态只能是 0、1 或 all"))
		return
	}
	if !validQueryPermissionType(permissionType) {
		fail(c, fieldError("type", "权限类型只能是 menu、directory、action 或 all"))
		return
	}
	permissions, err := h.svc.ListPermissions(c.Request.Context(),
		c.Query("id"), c.Query("name"), c.Query("path"), status, permissionType)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, permissions)
}

func (h *Handlers) getPermission(c *gin.Context) {
	permission, err := h.svc.GetPermission(c.Request.Context(), c.Param("permissionId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, permission)
}

func (h *Handlers) addPermission(c *gin.Context) {
	var request addPermissionRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if !digitsAtLeastTwo.MatchString(request.ID) {
		fail(c, fieldError("id", "权限编码只能包含数字"))
		return
	}
	if err := validatePermissionType(request.Type); err != nil {
		fail(c, err)
		return
	}
	permission, err := h.svc.AddPermission(c.Request.Context(), request.ID, request.Name, request.Path,
		request.Action, request.Type, request.ParentID)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, permission)
}

func (h *Handlers) updatePermission(c *gin.Context) {
	var request editPermissionRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if request.Name != nil {
		length := utf8.RuneCountInString(*request.Name)
		if length < 2 || length > 50 {
			fail(c, fieldError("name", "权限名称长度需在 2-50 之间"))
			return
		}
	}
	if request.Path != nil && utf8.RuneCountInString(*request.Path) > 200 {
		fail(c, fieldError("path", "权限路径长度不能超过 200"))
		return
	}
	if request.Status != nil {
		if err := validateStatus(*request.Status); err != nil {
			fail(c, err)
			return
		}
	}
	if request.Type != nil {
		if err := validatePermissionType(*request.Type); err != nil {
			fail(c, err)
			return
		}
	}
	err := h.svc.UpdatePermission(c.Request.Context(), c.Param("permissionId"), servicePermissionUpdate(request))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func servicePermissionUpdate(request editPermissionRequest) service.PermissionUpdate {
	return service.PermissionUpdate{
		Name:   request.Name,
		Path:   request.Path,
		Action: request.Action,
		Type:   request.Type,
		Status: request.Status,
	}
}

func (h *Handlers) deletePermission(c *gin.Context) {
	if err := h.svc.DeletePermissions(c.Request.Context(), []string{c.Param("permissionId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) deletePermissionIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, fieldError("ids", "权限ID列表不能为空"))
		return
	}
	if err := h.svc.DeletePermissions(c.Request.Context(), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}
