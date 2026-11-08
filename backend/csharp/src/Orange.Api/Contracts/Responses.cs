namespace Orange.Api.Contracts;

public sealed class ApiResponse<T>
{
    public int Code { get; set; }
    public string Message { get; set; } = "";
    public T? Data { get; set; }
    public long Timestamp { get; set; }
    public string TraceId { get; set; } = "";
}

public sealed class PageData<T>
{
    public long Total { get; set; }
    public IReadOnlyList<T> List { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int Size { get; set; }
    public int TotalPages { get; set; }

    public static PageData<T> Of(long total, IReadOnlyList<T> list, int page, int size)
        => new()
        {
            Total = total,
            List = list,
            Page = page,
            Size = size,
            TotalPages = total == 0 ? 0 : (int)Math.Ceiling((double)total / size)
        };
}

public sealed class LoginResponse
{
    public string Token { get; set; } = "";
    public string Status { get; set; } = "ok";
    public string? Field { get; set; }
    public string? Msg { get; set; }
    public long ExpiresIn { get; set; }
    public long RefreshExpiresIn { get; set; }
}

public sealed class RoleInfo
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
}

public sealed class PermissionInfo
{
    public string? Role { get; set; }
    public string Type { get; set; } = "";
    public string Path { get; set; } = "";
    public string? Action { get; set; }
}

public sealed class UserInfoResponse
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string Username { get; set; } = "";
    public string? Email { get; set; }
    public string? GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
    public List<RoleInfo> Roles { get; set; } = new();
    public List<PermissionInfo> RolePermissions { get; set; } = new();
    public List<PermissionInfo> UserPermissions { get; set; } = new();
}

public sealed class MenuInfo
{
    public string Id { get; set; } = "";
    public string Path { get; set; } = "";
    public string Type { get; set; } = "";
    public string? Name { get; set; }
    public List<MenuInfo> Children { get; set; } = new();
}

public sealed class UserBean
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string Username { get; set; } = "";
    public string? Email { get; set; }
    public string? GroupId { get; set; }
    public string? GroupName { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
    public List<UserRoleBean> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
}

public sealed class UserRoleBean
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
}

public sealed class RoleBean
{
    public string? Name { get; set; }
    public string Id { get; set; } = "";
    public string? Status { get; set; }
    public List<string>? Permissions { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
}

public sealed class GroupBean
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string? Status { get; set; }
    public string? ParentId { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
}

public sealed class PermissionBean
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string? Path { get; set; }
    public string? Action { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
    public string? ParentId { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }

    /// <summary>Locale-to-name map; callers fall back to <see cref="Name"/>.</summary>
    public Dictionary<string, string> Translations { get; set; } = new();
}

public sealed class OperationLogBean
{
    public long Id { get; set; }
    public string? TraceId { get; set; }
    public string? Username { get; set; }
    public string? Method { get; set; }
    public string? Path { get; set; }
    public string? QueryString { get; set; }
    public string? RequestBody { get; set; }
    public int Status { get; set; }
    public long DurationMs { get; set; }
    public string? Ip { get; set; }
    public DateTimeOffset CreateTime { get; set; }
}
