package domain

// Business error codes from docs/API.md.
const (
	CodeSuccess                = 200
	CodeParamError             = 40001
	CodeValidationError        = 40002
	CodeUnauthorized           = 40101
	CodeAuthDenied             = 40301
	CodePasswordChangeRequired = 40302
	CodeNotFound               = 40401
	CodeMethodNotAllowed       = 40501
	CodeConflict               = 40901
	CodeSystemError            = 50000
	CodeTooManyRequests        = 429
)

// Error is a business error. The HTTP status is the transport status and Code
// is the envelope business code. Handlers translate it to the response body.
type Error struct {
	Code       int
	HTTPStatus int
	Message    string
	Data       any
}

func (e *Error) Error() string { return e.Message }

func NewError(code, httpStatus int, message string) *Error {
	return &Error{Code: code, HTTPStatus: httpStatus, Message: message}
}

func Validation(message string) *Error {
	return NewError(CodeValidationError, 400, message)
}

func ParamError(message string) *Error {
	return NewError(CodeParamError, 400, message)
}

func Unauthorized(message string) *Error {
	return NewError(CodeUnauthorized, 401, message)
}

func Forbidden(message string) *Error {
	return NewError(CodeAuthDenied, 403, message)
}

func PasswordChangeRequired() *Error {
	return NewError(CodePasswordChangeRequired, 403, "请先修改初始密码")
}

func NotFound(message string) *Error {
	return NewError(CodeNotFound, 404, message)
}

func Conflict(message string) *Error {
	return NewError(CodeConflict, 409, message)
}

func MethodNotAllowed() *Error {
	return NewError(CodeMethodNotAllowed, 405, "方法不允许")
}

func TooManyRequests(message string) *Error {
	return NewError(CodeTooManyRequests, 429, message)
}

func SystemError() *Error {
	return NewError(CodeSystemError, 500, "系统异常")
}
