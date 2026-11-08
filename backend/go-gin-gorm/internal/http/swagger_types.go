package http

import "github.com/orange/backend-go-gin-gorm/internal/service"

// The handlers return service.PageData[T], but swag cannot resolve a generic
// instantiation whose type argument lives in another package. These types
// mirror the same JSON shape so the generated document describes the real
// responses. Keep the fields in sync with service.PageData.
type RolePageData struct {
	Total      int64              `json:"total"`
	List       []service.RoleBean `json:"list"`
	Page       int                `json:"page"`
	Size       int                `json:"size"`
	TotalPages int                `json:"totalPages"`
}

type UserPageData struct {
	Total      int64              `json:"total"`
	List       []service.UserBean `json:"list"`
	Page       int                `json:"page"`
	Size       int                `json:"size"`
	TotalPages int                `json:"totalPages"`
}

type OperationLogPageData struct {
	Total      int64                      `json:"total"`
	List       []service.OperationLogBean `json:"list"`
	Page       int                        `json:"page"`
	Size       int                        `json:"size"`
	TotalPages int                        `json:"totalPages"`
}
