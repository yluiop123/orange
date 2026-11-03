package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
)

const (
	ctxTraceID = "orange.traceId"
	ctxActor   = "orange.actor"
	ctxClaims  = "orange.claims"
)

func traceIDOf(c *gin.Context) string {
	if value, ok := c.Get(ctxTraceID); ok {
		if text, ok := value.(string); ok {
			return text
		}
	}
	return ""
}

func actorOf(c *gin.Context) *auth.Principal {
	if value, ok := c.Get(ctxActor); ok {
		if principal, ok := value.(*auth.Principal); ok {
			return principal
		}
	}
	return nil
}

func claimsOf(c *gin.Context) *auth.Claims {
	if value, ok := c.Get(ctxClaims); ok {
		if claims, ok := value.(*auth.Claims); ok {
			return claims
		}
	}
	return nil
}

func bearerToken(c *gin.Context) string {
	header := c.GetHeader("Authorization")
	const prefix = "Bearer "
	if len(header) <= len(prefix) || header[:len(prefix)] != prefix {
		return ""
	}
	return header[len(prefix):]
}

// optionalAuth attaches the principal when a valid bearer token is present but
// never rejects the request. Logout uses it so it also works with only a
// refresh cookie.
func (h *Handlers) optionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := bearerToken(c)
		if token == "" {
			c.Next()
			return
		}
		claims, err := h.svc.Tokens().Parse(token, auth.TokenTypeAccess)
		if err != nil {
			c.Next()
			return
		}
		revoked, err := h.store.IsTokenRevoked(c.Request.Context(), claims.ID)
		if err != nil || revoked {
			c.Next()
			return
		}
		principal, err := h.svc.LoadPrincipal(c.Request.Context(), claims.Username)
		if err != nil || principal == nil || !principal.Enabled || principal.TokenVersion != claims.Version {
			c.Next()
			return
		}
		c.Set(ctxActor, principal)
		c.Set(ctxClaims, claims)
		c.Next()
	}
}

// requireAuth enforces the access token, revocation, token version, user status
// and the forced-password-change rule.
func (h *Handlers) requireAuth() gin.HandlerFunc {
	allowedBeforePasswordChange := map[string]bool{
		"/api/v1/auth/change-password": true,
		"/api/v1/auth/user-info":       true,
		"/api/v1/auth/menus":           true,
		"/api/v1/auth/logout":          true,
	}
	return func(c *gin.Context) {
		token := bearerToken(c)
		if token == "" {
			abortWithError(c, http.StatusUnauthorized, "未登录")
			return
		}
		claims, err := h.svc.Tokens().Parse(token, auth.TokenTypeAccess)
		if err != nil {
			abortWithError(c, http.StatusUnauthorized, "未登录")
			return
		}
		revoked, err := h.store.IsTokenRevoked(c.Request.Context(), claims.ID)
		if err != nil {
			fail(c, err)
			c.Abort()
			return
		}
		if revoked {
			abortWithError(c, http.StatusUnauthorized, "登录已过期")
			return
		}
		principal, err := h.svc.LoadPrincipal(c.Request.Context(), claims.Username)
		if err != nil {
			fail(c, err)
			c.Abort()
			return
		}
		if principal == nil || !principal.Enabled || principal.TokenVersion != claims.Version ||
			principal.Username != claims.Username {
			abortWithError(c, http.StatusUnauthorized, "登录已过期")
			return
		}
		if principal.MustChangePassword && !allowedBeforePasswordChange[c.Request.URL.Path] {
			fail(c, forbiddenPasswordChange())
			c.Abort()
			return
		}
		c.Set(ctxActor, principal)
		c.Set(ctxClaims, claims)
		c.Next()
	}
}

func requireAuthority(authority string) gin.HandlerFunc {
	return func(c *gin.Context) {
		actor := actorOf(c)
		if actor == nil || !actor.HasAuthority(authority) {
			abortWithError(c, http.StatusForbidden, "无权限")
			return
		}
		c.Next()
	}
}
