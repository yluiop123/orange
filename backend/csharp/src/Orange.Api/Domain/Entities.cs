namespace Orange.Api.Domain;

/// <summary>
/// Plain domain entities. They are mapped with Fluent API in <see cref="Data.OrangeDbContext"/>
/// so the policies can be unit-tested without a database.
/// </summary>
public class Group
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string Status { get; set; } = "1";
    public string? ParentId { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public int Version { get; set; }
}

public class Permission
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string Path { get; set; } = "";
    public string? Action { get; set; }
    public string Type { get; set; } = "";
    public string Status { get; set; } = "1";
    public string? ParentId { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public int Version { get; set; }
}

/// <summary>Localized display name of a permission, one row per locale.</summary>
public class PermissionI18n
{
    public string PermissionId { get; set; } = "";
    public string Locale { get; set; } = "";
    public string Name { get; set; } = "";
}

public class Role
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string Status { get; set; } = "1";
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public int Version { get; set; }

    /// <summary>Populated explicitly by services; ignored by EF Core.</summary>
    public List<Permission> Permissions { get; set; } = new();
}

public class User
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    public string Username { get; set; } = "";
    public string? Email { get; set; }
    public string? GroupId { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = "1";
    public string? Password { get; set; }
    public int TokenVersion { get; set; }
    public bool MustChangePassword { get; set; }
    public int Version { get; set; }
    public DateTimeOffset? CreateTime { get; set; }
    public DateTimeOffset? UpdateTime { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class UserRole
{
    public string UserId { get; set; } = "";
    public string RoleId { get; set; } = "";
}

public class UserPermission
{
    public string UserId { get; set; } = "";
    public string PermissionId { get; set; } = "";
}

public class RolePermission
{
    public string RoleId { get; set; } = "";
    public string PermissionId { get; set; } = "";
}

public class RevokedToken
{
    public string Jti { get; set; } = "";
    public string TokenType { get; set; } = "access";
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreateTime { get; set; }
}

public class LoginAttempt
{
    public string Key { get; set; } = "";
    public int Failures { get; set; }
    public DateTimeOffset WindowStart { get; set; }
    public DateTimeOffset? LockedUntil { get; set; }
    public DateTimeOffset UpdateTime { get; set; }
}

public class OperationLogEntry
{
    public long Id { get; set; }
    public string? TraceId { get; set; }
    public string? Username { get; set; }
    public string Method { get; set; } = "";
    public string Path { get; set; } = "";
    public string? QueryString { get; set; }
    public string? RequestBody { get; set; }
    public int Status { get; set; }
    public long DurationMs { get; set; }
    public string? Ip { get; set; }
    public DateTimeOffset CreateTime { get; set; }
}
