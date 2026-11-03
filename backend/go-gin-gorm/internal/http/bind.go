package http

import (
	"errors"
	"net/mail"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"github.com/orange/backend-go-gin-gorm/internal/domain"
)

var (
	usernamePattern  = regexp.MustCompile(`^[A-Za-z0-9_]{4,50}$`)
	phonePattern     = regexp.MustCompile(`^1[3-9][0-9]{9}$`)
	roleIDPattern    = regexp.MustCompile(`^[A-Za-z0-9_-]{2,32}$`)
	statusPattern    = regexp.MustCompile(`^(0|1)$`)
	directionValue   = regexp.MustCompile(`^(asc|desc)$`)
	logStatusValue   = regexp.MustCompile(`^[0-9]{3}$`)
	digitsAtLeastTwo = regexp.MustCompile(`^[0-9]{2,}$`)
)

func bindJSON(c *gin.Context, target any) *domain.Error {
	if err := c.ShouldBindJSON(target); err != nil {
		return bindingError(err)
	}
	return nil
}

func bindQuery(c *gin.Context, target any) *domain.Error {
	if err := c.ShouldBindQuery(target); err != nil {
		return bindingError(err)
	}
	return nil
}

func bindingError(err error) *domain.Error {
	business := domain.ParamError("参数错误")
	var validation validator.ValidationErrors
	if errors.As(err, &validation) {
		fields := make(map[string]string, len(validation))
		for _, fieldError := range validation {
			fields[lowerFirst(fieldError.Field())] = "invalid value"
		}
		business.Data = fields
	}
	return business
}

func lowerFirst(value string) string {
	if value == "" {
		return value
	}
	first := value[0]
	if first >= 'A' && first <= 'Z' {
		first += 'a' - 'A'
	}
	return string(first) + value[1:]
}

func fieldError(field, message string) *domain.Error {
	business := domain.ParamError("参数错误")
	business.Data = map[string]string{field: message}
	return business
}

func validateStatus(status string) *domain.Error {
	if !statusPattern.MatchString(status) {
		return fieldError("status", "状态只能是 0 或 1")
	}
	return nil
}

func validateUsername(username string) *domain.Error {
	if !usernamePattern.MatchString(username) {
		return fieldError("username", "只能包含字母、数字和下划线，且长度需在 4-50 之间")
	}
	return nil
}

func validateEmail(email string) *domain.Error {
	if _, err := mail.ParseAddress(email); err != nil {
		return fieldError("email", "邮箱格式不正确")
	}
	return nil
}

func validatePhone(phone string) *domain.Error {
	if !phonePattern.MatchString(phone) {
		return fieldError("phone", "手机号格式不正确")
	}
	return nil
}

func validateRoleID(id string) *domain.Error {
	if !roleIDPattern.MatchString(id) {
		return fieldError("id", "角色ID只能包含字母、数字、下划线和中划线")
	}
	return nil
}

func validatePermissionType(permissionType string) *domain.Error {
	if !domain.ValidPermissionType(permissionType) {
		return fieldError("type", "权限类型只能是 menu、action 或 directory")
	}
	return nil
}

func validateDirection(direction string) *domain.Error {
	if direction != "" && !directionValue.MatchString(direction) {
		return fieldError("direction", "排序方向只能是 asc 或 desc")
	}
	return nil
}

func validatePage(page, size, maxPage int) *domain.Error {
	if page < 1 || page > maxPage {
		return fieldError("page", "页码超出范围")
	}
	if size < 1 || size > 100 {
		return fieldError("size", "每页数量需在 1-100 之间")
	}
	return nil
}

func intQuery(c *gin.Context, name string, fallback int) (int, *domain.Error) {
	raw := c.Query(name)
	if raw == "" {
		return fallback, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return 0, fieldError(name, "必须为整数")
	}
	return value, nil
}

func splitIDs(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
