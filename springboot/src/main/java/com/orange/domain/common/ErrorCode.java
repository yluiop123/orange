package com.orange.domain.common;

public enum ErrorCode {

    SUCCESS(200, "success", 200),

    PARAM_ERROR(40001, "参数错误", 400),
    VALIDATE_ERROR(40002, "校验失败", 400),
    UNAUTHORIZED(40101, "未登录", 401),
    PASSWORD_CHANGE_REQUIRED(40302, "请先修改初始密码", 403),
    AUTH_DENIED(40301, "无权限", 403),
    NOT_FOUND(40401, "数据不存在", 404),
    METHOD_NOT_ALLOWED(40501, "方法不允许", 405),
    CONFLICT(40901, "数据冲突", 409),

    SYSTEM_ERROR(50000, "系统异常", 500);

    private final int code;
    private final String message;
    private final int httpStatus;

    ErrorCode(int code, String message, int httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }

    public String getMessage() {
        return message;
    }

    public int getCode() {
        return code;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}
