using System.ComponentModel.DataAnnotations;

namespace Orange.Api.Contracts;

public sealed class LoginRequest
{
    [Required(ErrorMessage = "用户名不能为空")]
    [RegularExpression("^[A-Za-z0-9_]{4,50}$", ErrorMessage = "只能包含字母、数字和下划线，且长度需在 4-50 之间")]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = "密码不能为空")]
    public string Password { get; set; } = "";
}

public sealed class ChangePasswordRequest
{
    [Required(ErrorMessage = "原密码不能为空")]
    public string OldPassword { get; set; } = "";

    [Required(ErrorMessage = "新密码不能为空")]
    [StringLength(64, MinimumLength = 8, ErrorMessage = "新密码长度需在 8-64 之间")]
    [RegularExpression("^(?=.*[A-Za-z])(?=.*\\d).{8,64}$", ErrorMessage = "新密码需同时包含字母和数字")]
    public string NewPassword { get; set; } = "";
}

public sealed class StatusRequest
{
    [Required(ErrorMessage = "状态不能为空")]
    [RegularExpression("^(0|1)$", ErrorMessage = "状态只能是 0 或 1")]
    public string Status { get; set; } = "";
}

public sealed class QueryUserRequest
{
    public string? Keyword { get; set; }

    [RegularExpression("^$|^(0|1|all)$", ErrorMessage = "状态只能是 0、1 或 all")]
    public string? Status { get; set; }

    public string? GroupId { get; set; }
    public string? Sort { get; set; }

    [RegularExpression("^$|^(asc|desc)$", ErrorMessage = "排序方向只能是 asc 或 desc")]
    public string? Direction { get; set; }

    public string? FilterField { get; set; }
    public string? FilterValue { get; set; }
    public string? OrderField { get; set; }

    [RegularExpression("^$|^(asc|desc)$", ErrorMessage = "排序方向只能是 asc 或 desc")]
    public string? OrderValue { get; set; }

    [Range(1, 10000, ErrorMessage = "页码不能小于 1 且不能超过 10000")]
    public int? Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "每页数量不能小于 1 且不能超过 100")]
    public int? Size { get; set; } = 10;
}

public sealed class AddUserRequest
{
    [Required(ErrorMessage = "用户姓名不能为空")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "用户姓名长度需在 2-50 之间")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 4, ErrorMessage = "用户名长度需在 4-50 之间")]
    [RegularExpression("^[A-Za-z0-9_]+$", ErrorMessage = "用户名只能包含字母、数字和下划线")]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "用户组不能为空")]
    public string GroupId { get; set; } = "";

    [Required(ErrorMessage = "手机号不能为空")]
    [RegularExpression("^1[3-9]\\d{9}$", ErrorMessage = "手机号格式不正确")]
    public string Phone { get; set; } = "";

    [RegularExpression("^(0|1)$", ErrorMessage = "状态只能是 0 或 1")]
    public string? Status { get; set; }

    public List<string>? Roles { get; set; }
    public List<string>? Permissions { get; set; }
}

public sealed class EditUserRequest
{
    [StringLength(50, MinimumLength = 2, ErrorMessage = "用户姓名长度需在 2-50 之间")]
    public string? Name { get; set; }

    [StringLength(50, MinimumLength = 4, ErrorMessage = "用户名长度需在 4-50 之间")]
    [RegularExpression("^[A-Za-z0-9_]{4,50}$", ErrorMessage = "用户名只能包含字母、数字和下划线")]
    public string? Username { get; set; }

    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string? Email { get; set; }

    public string? GroupId { get; set; }

    [RegularExpression("^1[3-9]\\d{9}$", ErrorMessage = "手机号格式不正确")]
    public string? Phone { get; set; }

    [RegularExpression("^(0|1)$", ErrorMessage = "状态只能是 0 或 1")]
    public string? Status { get; set; }

    public List<string>? Roles { get; set; }
    public List<string>? Permissions { get; set; }
}

public sealed class AddRoleRequest
{
    [Required(ErrorMessage = "角色名称不能为空")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "角色名称长度需在 2-50 之间")]
    public string Name { get; set; } = "";

    [RegularExpression("^[A-Za-z0-9_-]{2,32}$", ErrorMessage = "角色ID只能包含字母、数字、下划线和中划线")]
    public string? Id { get; set; }

    public List<string>? Permissions { get; set; }
}

public sealed class EditRoleRequest
{
    [StringLength(50, MinimumLength = 2, ErrorMessage = "角色名称长度需在 2-50 之间")]
    public string? Name { get; set; }

    [RegularExpression("^(0|1)$", ErrorMessage = "状态只能是 0 或 1")]
    public string? Status { get; set; }

    public List<string>? Permissions { get; set; }
}

public sealed class QueryRoleRequest
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Status { get; set; }
    public string? Sort { get; set; }

    [RegularExpression("^$|^(asc|desc)$", ErrorMessage = "排序方向只能是 asc 或 desc")]
    public string? Direction { get; set; }

    public string? OrderField { get; set; }

    [RegularExpression("^$|^(asc|desc)$", ErrorMessage = "排序方向只能是 asc 或 desc")]
    public string? OrderValue { get; set; }

    [Range(1, 10000, ErrorMessage = "页码不能小于 1 且不能超过 10000")]
    public int? Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "每页数量不能小于 1 且不能超过 100")]
    public int? Size { get; set; } = 10;
}

public sealed class AddChildGroupRequest
{
    [Required(ErrorMessage = "分组ID不能为空")]
    [RegularExpression("^[0-9]{2,}$", ErrorMessage = "组织编码只能包含数字")]
    public string Id { get; set; } = "";

    [Required(ErrorMessage = "分组名称不能为空")]
    public string Name { get; set; } = "";

    public string? ParentId { get; set; }
}

public sealed class EditGroupRequest
{
    [Required(ErrorMessage = "组织名称不能为空")]
    public string Name { get; set; } = "";

    [RegularExpression("^(0|1)$", ErrorMessage = "状态只能是 0 或 1")]
    public string? Status { get; set; }
}

public sealed class QueryGroupRequest
{
    [RegularExpression("^$|^[A-Za-z0-9]+$", ErrorMessage = "只能包含数字和大小写字母")]
    public string? Id { get; set; }

    public string? Name { get; set; }

    [RegularExpression("^$|^(0|1|all)$", ErrorMessage = "只能是 0 或 1 或 all")]
    public string? Status { get; set; }
}

public sealed class AddChildPermissionRequest
{
    [Required(ErrorMessage = "权限编码不能为空")]
    [RegularExpression("^[0-9]{2,}$", ErrorMessage = "权限编码只能包含数字")]
    public string Id { get; set; } = "";

    [Required(ErrorMessage = "权限名称不能为空")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "权限路径不能为空")]
    public string Path { get; set; } = "";

    public string? Action { get; set; }

    [Required(ErrorMessage = "权限类型不能为空")]
    [RegularExpression("^(menu|action|directory)$", ErrorMessage = "权限类型只能是 menu、action 或 directory")]
    public string Type { get; set; } = "";

    public string? ParentId { get; set; }

    /// <summary>Locale-to-name map inserted together with the permission.</summary>
    public Dictionary<string, string>? Translations { get; set; }
}

public sealed class EditPermissionRequest
{
    [StringLength(50, MinimumLength = 2, ErrorMessage = "权限名称长度需在 2-50 之间")]
    public string? Name { get; set; }

    [StringLength(200, ErrorMessage = "权限路径长度不能超过 200")]
    public string? Path { get; set; }

    public string? Action { get; set; }

    [RegularExpression("^(0|1)$", ErrorMessage = "状态只能是 0 或 1")]
    public string? Status { get; set; }

    [RegularExpression("^(menu|action|directory)$", ErrorMessage = "权限类型只能是 menu、action 或 directory")]
    public string? Type { get; set; }

    /// <summary>
    /// Locale-to-name map. Omitted keeps the current rows; provided replaces
    /// every row for this permission (an empty map clears them).
    /// </summary>
    public Dictionary<string, string>? Translations { get; set; }
}

public sealed class QueryPermissionRequest
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Path { get; set; }

    [RegularExpression("^$|^(0|1|all)$", ErrorMessage = "状态只能是 0、1 或 all")]
    public string? Status { get; set; }

    [RegularExpression("^$|^(menu|directory|action|all)$", ErrorMessage = "权限类型只能是 menu、directory、action 或 all")]
    public string? Type { get; set; }
}

public sealed class QueryOperationLogRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "页码必须大于 0")]
    public int? Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "每页数量不能超过 100")]
    public int? Size { get; set; } = 10;

    public string? Username { get; set; }
    public string? Path { get; set; }

    [RegularExpression("^$|^\\d{3}$", ErrorMessage = "状态码必须是 3 位数字")]
    public string? Status { get; set; }

    public DateTimeOffset? From { get; set; }
    public DateTimeOffset? To { get; set; }
}
