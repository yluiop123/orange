package http

import (
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/service"
)

type addUserRequest struct {
	Name        string   `json:"name" binding:"required"`
	Username    string   `json:"username" binding:"required"`
	Email       string   `json:"email" binding:"required"`
	GroupID     string   `json:"groupId" binding:"required"`
	Phone       string   `json:"phone" binding:"required"`
	Status      *string  `json:"status"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}

type editUserRequest struct {
	Name        *string   `json:"name"`
	Username    *string   `json:"username"`
	Email       *string   `json:"email"`
	GroupID     *string   `json:"groupId"`
	Phone       *string   `json:"phone"`
	Status      *string   `json:"status"`
	Roles       *[]string `json:"roles"`
	Permissions *[]string `json:"permissions"`
}

func (h *Handlers) listUsers(c *gin.Context) {
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
	status := c.Query("status")
	if status != "" && status != "all" && status != "0" && status != "1" {
		fail(c, fieldError("status", "状态只能是 0、1 或 all"))
		return
	}
	direction := c.Query("direction")
	if err := validateDirection(direction); err != nil {
		fail(c, err)
		return
	}
	result, err := h.svc.ListUsers(c.Request.Context(), service.UserListQuery{
		Keyword:   c.Query("keyword"),
		Status:    status,
		GroupID:   c.Query("groupId"),
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

func (h *Handlers) getUser(c *gin.Context) {
	user, err := h.svc.GetUser(c.Request.Context(), c.Param("userId"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, user)
}

func (h *Handlers) addUser(c *gin.Context) {
	var request addUserRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if length := utf8.RuneCountInString(request.Name); length < 2 || length > 50 {
		fail(c, fieldError("name", "用户姓名长度需在 2-50 之间"))
		return
	}
	if err := validateUsername(request.Username); err != nil {
		fail(c, err)
		return
	}
	if err := validateEmail(request.Email); err != nil {
		fail(c, err)
		return
	}
	if err := validatePhone(request.Phone); err != nil {
		fail(c, err)
		return
	}
	if request.Status != nil {
		if err := validateStatus(*request.Status); err != nil {
			fail(c, err)
			return
		}
	}
	tempPassword, err := h.svc.AddUser(c.Request.Context(), actorOf(c), service.AddUserInput{
		Name:        request.Name,
		Username:    request.Username,
		Email:       request.Email,
		GroupID:     request.GroupID,
		Phone:       request.Phone,
		Status:      request.Status,
		Roles:       request.Roles,
		Permissions: request.Permissions,
	})
	if err != nil {
		fail(c, err)
		return
	}
	successMessage(c, "操作成功", tempPassword)
}

func (h *Handlers) updateUser(c *gin.Context) {
	var request editUserRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if request.Name != nil {
		if length := utf8.RuneCountInString(*request.Name); length < 2 || length > 50 {
			fail(c, fieldError("name", "用户姓名长度需在 2-50 之间"))
			return
		}
	}
	if request.Username != nil {
		if err := validateUsername(*request.Username); err != nil {
			fail(c, err)
			return
		}
	}
	if request.Email != nil && *request.Email != "" {
		if err := validateEmail(*request.Email); err != nil {
			fail(c, err)
			return
		}
	}
	if request.Phone != nil {
		if err := validatePhone(*request.Phone); err != nil {
			fail(c, err)
			return
		}
	}
	if request.Status != nil {
		if err := validateStatus(*request.Status); err != nil {
			fail(c, err)
			return
		}
	}
	err := h.svc.UpdateUser(c.Request.Context(), actorOf(c), c.Param("userId"), service.UserUpdate{
		Name:        request.Name,
		Username:    request.Username,
		Email:       request.Email,
		GroupID:     request.GroupID,
		Phone:       request.Phone,
		Status:      request.Status,
		Roles:       request.Roles,
		Permissions: request.Permissions,
	})
	if err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) updateUserStatus(c *gin.Context) {
	var request statusRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if err := validateStatus(request.Status); err != nil {
		fail(c, err)
		return
	}
	err := h.svc.UpdateUser(c.Request.Context(), actorOf(c), c.Param("userId"), service.UserUpdate{
		Status: &request.Status,
	})
	if err != nil {
		fail(c, err)
		return
	}
	success(c, "操作成功")
}

func (h *Handlers) resetPassword(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	tempPassword, err := h.svc.ResetPassword(c.Request.Context(), actorOf(c), c.Param("userId"))
	if err != nil {
		fail(c, err)
		return
	}
	successMessage(c, "操作成功", tempPassword)
}

func (h *Handlers) deleteUser(c *gin.Context) {
	if err := h.svc.DeleteUsers(c.Request.Context(), actorOf(c), []string{c.Param("userId")}); err != nil {
		fail(c, err)
		return
	}
	success(c, "删除成功")
}

func (h *Handlers) deleteUserIDs(c *gin.Context) {
	ids := c.Query("ids")
	if strings.TrimSpace(ids) == "" {
		fail(c, domain.ParamError("ids 不能为空"))
		return
	}
	if err := h.svc.DeleteUsers(c.Request.Context(), actorOf(c), splitIDs(ids)); err != nil {
		fail(c, err)
		return
	}
	success(c, "删除成功")
}
