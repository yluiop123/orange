package http

import (
	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type changePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
}

func (h *Handlers) login(c *gin.Context) {
	var request loginRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if err := validateUsername(request.Username); err != nil {
		fail(c, err)
		return
	}
	result, err := h.svc.Login(c.Request.Context(), request.Username, request.Password,
		domain.ClientIP(c.GetHeader("X-Forwarded-For"), c.ClientIP()))
	if err != nil {
		if business, ok := err.(*domain.Error); ok && business.Code == domain.CodeUnauthorized {
			h.cookies.Clear(c.Writer)
		}
		fail(c, err)
		return
	}
	h.cookies.SetRefresh(c.Writer, result.RefreshToken)
	success(c, result)
}

func (h *Handlers) refresh(c *gin.Context) {
	raw, err := c.Cookie(auth.RefreshCookieName)
	if err != nil || raw == "" {
		h.cookies.Clear(c.Writer)
		fail(c, domain.Unauthorized("未登录"))
		return
	}
	result, err := h.svc.RefreshToken(c.Request.Context(), raw)
	if err != nil {
		h.cookies.Clear(c.Writer)
		fail(c, err)
		return
	}
	h.cookies.SetRefresh(c.Writer, result.RefreshToken)
	success(c, result)
}

func (h *Handlers) logout(c *gin.Context) {
	raw, _ := c.Cookie(auth.RefreshCookieName)
	h.svc.Logout(c.Request.Context(), raw, claimsOf(c))
	h.cookies.Clear(c.Writer)
	success(c, "ok")
}

func (h *Handlers) userInfo(c *gin.Context) {
	actor := actorOf(c)
	if actor == nil {
		fail(c, domain.Unauthorized("未登录"))
		return
	}
	info, err := h.svc.UserInfo(c.Request.Context(), actor.Username)
	if err != nil {
		fail(c, err)
		return
	}
	success(c, info)
}

func (h *Handlers) menus(c *gin.Context) {
	menus, err := h.svc.Menus(c.Request.Context(), c.GetHeader("Locale"))
	if err != nil {
		fail(c, err)
		return
	}
	success(c, menus)
}

func (h *Handlers) changePassword(c *gin.Context) {
	actor := actorOf(c)
	if actor == nil {
		fail(c, domain.Unauthorized("未登录"))
		return
	}
	var request changePasswordRequest
	if err := bindJSON(c, &request); err != nil {
		fail(c, err)
		return
	}
	if err := validateNewPassword(request.NewPassword); err != nil {
		fail(c, err)
		return
	}
	if err := h.svc.ChangePassword(c.Request.Context(), actor.Username, request.OldPassword, request.NewPassword); err != nil {
		fail(c, err)
		return
	}
	// Old tokens are invalid now; clear the cookie so the client starts clean.
	h.cookies.Clear(c.Writer)
	success(c, "密码已修改，请重新登录")
}

func validateNewPassword(password string) *domain.Error {
	if len(password) < 8 || len(password) > 64 {
		return fieldError("newPassword", "新密码长度需在 8-64 之间")
	}
	hasLetter := false
	hasDigit := false
	for _, r := range password {
		switch {
		case r >= 'A' && r <= 'Z', r >= 'a' && r <= 'z':
			hasLetter = true
		case r >= '0' && r <= '9':
			hasDigit = true
		}
	}
	if !hasLetter || !hasDigit {
		return fieldError("newPassword", "新密码需同时包含字母和数字")
	}
	return nil
}
