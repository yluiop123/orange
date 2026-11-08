package http

import (
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/service"
)

var permissionLocalePattern = regexp.MustCompile(`^[a-z]{2}(-[A-Za-z]{2})?$`)

type addPermissionRequest struct {
	ID           string            `json:"id" binding:"required"`
	Name         string            `json:"name" binding:"required"`
	Path         string            `json:"path" binding:"required"`
	Action       *string           `json:"action"`
	Type         string            `json:"type" binding:"required"`
	ParentID     *string           `json:"parentId"`
	Translations map[string]string `json:"translations"`
}

type editPermissionRequest struct {
	Name         *string           `json:"name"`
	Path         *string           `json:"path"`
	Action       *string           `json:"action"`
	Status       *string           `json:"status"`
	Type         *string           `json:"type"`
	Translations map[string]string `json:"translations"`
}

// validatePermissionTranslations checks the locale keys and display names of a
// provided translations map. A nil map means "not provided" and is valid.
func validatePermissionTranslations(translations map[string]string) *domain.Error {
	locales := make([]string, 0, len(translations))
	for locale := range translations {
		locales = append(locales, locale)
	}
	sort.Strings(locales)
	for _, locale := range locales {
		if !permissionLocalePattern.MatchString(locale) {
			return fieldError("translations", "翻译语言代码需形如 en 或 en-US")
		}
		name := translations[locale]
		if strings.TrimSpace(name) == "" {
			return fieldError("translations", "翻译名称不能为空")
		}
		if utf8.RuneCountInString(name) > 255 {
			return fieldError("translations", "翻译名称长度不能超过 255")
		}
	}
	return nil
}

func validQueryPermissionType(value string) bool {
	switch value {
	case "", domain.StatusAll, domain.PermissionTypeMenu, domain.PermissionTypeAction, domain.PermissionTypeDirectory:
		return true
	default:
		return false
	}
}

// @Summary List permissions
// @Description Returns the permission tree, optionally filtered by id, name, path, status or type.
// @Tags Permissions
// @Produce json
// @Param id query string false "Permission id prefix"
// @Param name query string false "Permission name prefix"
// @Param path query string false "Permission path prefix"
// @Param status query string false "Status filter: 0, 1 or all" Enums(0, 1, all)
// @Param type query string false "Permission type filter: menu, directory, action or all" Enums(menu, directory, action, all)
// @Success 200 {object} Envelope{data=[]service.PermissionBean}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Security BearerAuth
// @Router /system/permissions [get]
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

// @Summary Get a permission
// @Tags Permissions
// @Produce json
// @Param permissionId path string true "Permission id"
// @Success 200 {object} Envelope{data=service.PermissionBean}
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Security BearerAuth
// @Router /system/permissions/{permissionId} [get]
func (h *Handlers) getPermission(c *gin.Context) {
	permission, err := h.svc.GetPermission(c.Request.Context(), c.Param("permissionId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, permission)
}

// @Summary Add a permission
// @Description Creates a menu, directory or action permission under an optional parent.
// @Tags Permissions
// @Accept json
// @Produce json
// @Param request body addPermissionRequest true "Permission to create"
// @Success 200 {object} Envelope{data=service.PermissionBean}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/permissions/children [post]
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
	if err := validatePermissionTranslations(request.Translations); err != nil {
		fail(c, err)
		return
	}
	permission, err := h.svc.AddPermission(c.Request.Context(), request.ID, request.Name, request.Path,
		request.Action, request.Type, request.ParentID, request.Translations)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, permission)
}

// @Summary Update a permission
// @Tags Permissions
// @Accept json
// @Produce json
// @Param permissionId path string true "Permission id"
// @Param request body editPermissionRequest true "Fields to update"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/permissions/{permissionId} [patch]
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
	if err := validatePermissionTranslations(request.Translations); err != nil {
		fail(c, err)
		return
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
		Name:         request.Name,
		Path:         request.Path,
		Action:       request.Action,
		Type:         request.Type,
		Status:       request.Status,
		Translations: request.Translations,
	}
}

// @Summary Delete a permission
// @Tags Permissions
// @Produce json
// @Param permissionId path string true "Permission id"
// @Success 200 {object} Envelope{data=string}
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/permissions/{permissionId} [delete]
func (h *Handlers) deletePermission(c *gin.Context) {
	if err := h.svc.DeletePermissions(c.Request.Context(), []string{c.Param("permissionId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

// @Summary Delete permissions
// @Tags Permissions
// @Produce json
// @Param ids query string true "Comma-separated permission ids"
// @Success 200 {object} Envelope{data=string}
// @Failure 400 {object} Envelope
// @Failure 401 {object} Envelope
// @Failure 403 {object} Envelope
// @Failure 404 {object} Envelope
// @Failure 409 {object} Envelope
// @Security BearerAuth
// @Router /system/permissions [delete]
func (h *Handlers) deletePermissionIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, domain.ParamError("ids 不能为空"))
		return
	}
	if err := h.svc.DeletePermissions(c.Request.Context(), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}
