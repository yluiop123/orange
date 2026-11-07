package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/orange/backend-go-gin-gorm/internal/auth"
	"github.com/orange/backend-go-gin-gorm/internal/config"
	"github.com/orange/backend-go-gin-gorm/internal/domain"
	"github.com/orange/backend-go-gin-gorm/internal/service"
	"github.com/orange/backend-go-gin-gorm/internal/store"
)

type Handlers struct {
	svc     *service.Service
	store   *store.Store
	cookies *auth.CookieManager
}

func NewRouter(svc *service.Service, st *store.Store, cfg config.Config) *gin.Engine {
	cookieManager := auth.NewCookieManager(cfg.Cookie, int(cfg.JWT.RefreshTTL.Seconds()))
	h := &Handlers{svc: svc, store: st, cookies: cookieManager}

	router := gin.New()
	router.HandleMethodNotAllowed = true
	router.Use(Recovery(), TraceID(), CORS(cfg.CORSOrigins), h.operationLog())

	// Documentation endpoints are anonymous and live outside the /api/v1 group.
	initSwagger()
	router.GET("/openapi.json", h.openapiJSON)
	router.GET("/swagger", h.swaggerUI)

	api := router.Group("/api/v1")

	authGroup := api.Group("/auth")
	authGroup.POST("/login", h.login)
	authGroup.POST("/refresh", h.refresh)
	authGroup.POST("/logout", h.optionalAuth(), h.logout)

	protected := authGroup.Group("", h.requireAuth())
	protected.GET("/user-info", h.userInfo)
	protected.GET("/menus", h.menus)
	protected.POST("/change-password", h.changePassword)

	system := api.Group("/system", h.requireAuth())

	groups := system.Group("/groups")
	groups.GET("", requireAuthority("menu#/system/group"), h.listGroups)
	groups.GET("/:groupId", requireAuthority("menu#/system/group"), h.getGroup)
	groups.POST("/children", requireAuthority("action#/system/group:add"), h.addGroup)
	groups.PATCH("/:groupId", requireAuthority("action#/system/group:edit"), h.updateGroup)
	groups.PATCH("/:groupId/status", requireAuthority("action#/system/group:edit"), h.updateGroupStatus)
	groups.DELETE("", requireAuthority("action#/system/group:delete"), h.deleteGroupIDs)
	groups.DELETE("/:groupId", requireAuthority("action#/system/group:delete"), h.deleteGroup)

	permissions := system.Group("/permissions")
	permissions.GET("", requireAuthority("menu#/system/permission"), h.listPermissions)
	permissions.GET("/:permissionId", requireAuthority("menu#/system/permission"), h.getPermission)
	permissions.POST("/children", requireAuthority("action#/system/permission:add"), h.addPermission)
	permissions.PATCH("/:permissionId", requireAuthority("action#/system/permission:edit"), h.updatePermission)
	permissions.DELETE("", requireAuthority("action#/system/permission:delete"), h.deletePermissionIDs)
	permissions.DELETE("/:permissionId", requireAuthority("action#/system/permission:delete"), h.deletePermission)

	roles := system.Group("/roles")
	roles.GET("", requireAuthority("menu#/system/role"), h.listRoles)
	roles.GET("/:roleId", requireAuthority("menu#/system/role"), h.getRole)
	roles.POST("", requireAuthority("action#/system/role:add"), h.addRole)
	roles.PATCH("/:roleId", requireAuthority("action#/system/role:edit"), h.updateRole)
	roles.DELETE("", requireAuthority("action#/system/role:delete"), h.deleteRoleIDs)
	roles.DELETE("/:roleId", requireAuthority("action#/system/role:delete"), h.deleteRole)

	users := system.Group("/users")
	users.GET("", requireAuthority("menu#/system/user"), h.listUsers)
	users.GET("/:userId", requireAuthority("menu#/system/user"), h.getUser)
	users.POST("", requireAuthority("action#/system/user:add"), h.addUser)
	users.PATCH("/:userId", requireAuthority("action#/system/user:edit"), h.updateUser)
	users.PATCH("/:userId/status", requireAuthority("action#/system/user:edit"), h.updateUserStatus)
	users.POST("/:userId/reset-password", requireAuthority("action#/system/user:edit"), h.resetPassword)
	users.DELETE("", requireAuthority("action#/system/user:delete"), h.deleteUserIDs)
	users.DELETE("/:userId", requireAuthority("action#/system/user:delete"), h.deleteUser)

	operationLogs := system.Group("/operation-logs")
	operationLogs.GET("", requireAuthority("menu#/system/operation-log"), h.listOperationLogs)

	router.NoRoute(func(c *gin.Context) {
		fail(c, domain.NotFound("数据不存在"))
	})
	router.NoMethod(func(c *gin.Context) {
		fail(c, domain.MethodNotAllowed())
	})
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	return router
}
