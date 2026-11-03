namespace Orange.Api.Domain;

/// <summary>Business codes and their transport status, mirrored from docs/API.md.</summary>
public static class ErrorCodes
{
    public const int Success = 200;
    public const int ParamError = 40001;
    public const int ValidationError = 40002;
    public const int Unauthorized = 40101;
    public const int Forbidden = 40301;
    public const int PasswordChangeRequired = 40302;
    public const int NotFound = 40401;
    public const int MethodNotAllowed = 40501;
    public const int Conflict = 40901;
    public const int SystemError = 50000;
    public const int TooManyRequests = 429;

    public const string ParamErrorMessage = "参数错误";
    public const string ValidationErrorMessage = "校验失败";
    public const string UnauthorizedMessage = "未登录";
    public const string ForbiddenMessage = "无权限";
    public const string PasswordChangeRequiredMessage = "请先修改初始密码";
    public const string NotFoundMessage = "数据不存在";
    public const string MethodNotAllowedMessage = "方法不允许";
    public const string ConflictMessage = "数据冲突";
    public const string SystemErrorMessage = "系统异常";

    public static int HttpStatusFor(int code) => code switch
    {
        Success => 200,
        ParamError => 400,
        ValidationError => 400,
        Unauthorized => 401,
        Forbidden => 403,
        PasswordChangeRequired => 403,
        NotFound => 404,
        MethodNotAllowed => 405,
        Conflict => 409,
        SystemError => 500,
        TooManyRequests => 429,
        _ => 500
    };

    public static string DefaultMessageFor(int code) => code switch
    {
        Success => "success",
        ParamError => ParamErrorMessage,
        ValidationError => ValidationErrorMessage,
        Unauthorized => UnauthorizedMessage,
        Forbidden => ForbiddenMessage,
        PasswordChangeRequired => PasswordChangeRequiredMessage,
        NotFound => NotFoundMessage,
        MethodNotAllowed => MethodNotAllowedMessage,
        Conflict => ConflictMessage,
        SystemError => SystemErrorMessage,
        _ => "error"
    };
}
