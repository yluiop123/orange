using Microsoft.EntityFrameworkCore;
using Orange.Api.Domain;

namespace Orange.Api.Data;

public class OrangeDbContext : DbContext
{
    public OrangeDbContext(DbContextOptions<OrangeDbContext> options) : base(options)
    {
    }

    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RevokedToken> RevokedTokens => Set<RevokedToken>();
    public DbSet<LoginAttempt> LoginAttempts => Set<LoginAttempt>();
    public DbSet<OperationLogEntry> OperationLogs => Set<OperationLogEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Group>(entity =>
        {
            entity.ToTable("sys_group");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Name).HasColumnName("name");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.ParentId).HasColumnName("parent_id");
            entity.Property(item => item.CreateTime).HasColumnName("create_time");
            entity.Property(item => item.UpdateTime).HasColumnName("update_time");
            entity.Property(item => item.CreatedBy).HasColumnName("created_by");
            entity.Property(item => item.UpdatedBy).HasColumnName("updated_by");
            entity.Property(item => item.Version).HasColumnName("version").IsConcurrencyToken();
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("sys_permission");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Name).HasColumnName("name");
            entity.Property(item => item.Path).HasColumnName("path");
            entity.Property(item => item.Action).HasColumnName("action");
            entity.Property(item => item.Type).HasColumnName("type");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.ParentId).HasColumnName("parent_id");
            entity.Property(item => item.CreateTime).HasColumnName("create_time");
            entity.Property(item => item.UpdateTime).HasColumnName("update_time");
            entity.Property(item => item.CreatedBy).HasColumnName("created_by");
            entity.Property(item => item.UpdatedBy).HasColumnName("updated_by");
            entity.Property(item => item.Version).HasColumnName("version").IsConcurrencyToken();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("sys_role");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Name).HasColumnName("name");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.CreateTime).HasColumnName("create_time");
            entity.Property(item => item.UpdateTime).HasColumnName("update_time");
            entity.Property(item => item.CreatedBy).HasColumnName("created_by");
            entity.Property(item => item.UpdatedBy).HasColumnName("updated_by");
            entity.Property(item => item.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Ignore(item => item.Permissions);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("sys_user");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id");
            entity.Property(item => item.Name).HasColumnName("name");
            entity.Property(item => item.Username).HasColumnName("username");
            entity.Property(item => item.Email).HasColumnName("email");
            entity.Property(item => item.GroupId).HasColumnName("group_id");
            entity.Property(item => item.Phone).HasColumnName("phone");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.Password).HasColumnName("password");
            entity.Property(item => item.TokenVersion).HasColumnName("token_version");
            entity.Property(item => item.MustChangePassword).HasColumnName("must_change_password");
            entity.Property(item => item.Version).HasColumnName("version").IsConcurrencyToken();
            entity.Property(item => item.CreateTime).HasColumnName("create_time");
            entity.Property(item => item.UpdateTime).HasColumnName("update_time");
            entity.Property(item => item.CreatedBy).HasColumnName("created_by");
            entity.Property(item => item.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("sys_user_role");
            entity.HasKey(item => new { item.UserId, item.RoleId });
            entity.Property(item => item.UserId).HasColumnName("user_id");
            entity.Property(item => item.RoleId).HasColumnName("role_id");
        });

        modelBuilder.Entity<UserPermission>(entity =>
        {
            entity.ToTable("sys_user_permission");
            entity.HasKey(item => new { item.UserId, item.PermissionId });
            entity.Property(item => item.UserId).HasColumnName("user_id");
            entity.Property(item => item.PermissionId).HasColumnName("permission_id");
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("sys_role_permission");
            entity.HasKey(item => new { item.RoleId, item.PermissionId });
            entity.Property(item => item.RoleId).HasColumnName("role_id");
            entity.Property(item => item.PermissionId).HasColumnName("permission_id");
        });

        modelBuilder.Entity<RevokedToken>(entity =>
        {
            entity.ToTable("sys_revoked_token");
            entity.HasKey(item => item.Jti);
            entity.Property(item => item.Jti).HasColumnName("jti");
            entity.Property(item => item.TokenType).HasColumnName("token_type");
            entity.Property(item => item.ExpiresAt).HasColumnName("expires_at");
            entity.Property(item => item.CreateTime).HasColumnName("create_time");
        });

        modelBuilder.Entity<LoginAttempt>(entity =>
        {
            entity.ToTable("sys_login_attempt");
            entity.HasKey(item => item.Key);
            entity.Property(item => item.Key).HasColumnName("attempt_key");
            entity.Property(item => item.Failures).HasColumnName("failures");
            entity.Property(item => item.WindowStart).HasColumnName("window_start");
            entity.Property(item => item.LockedUntil).HasColumnName("locked_until");
            entity.Property(item => item.UpdateTime).HasColumnName("update_time");
        });

        modelBuilder.Entity<OperationLogEntry>(entity =>
        {
            entity.ToTable("sys_operation_log");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(item => item.TraceId).HasColumnName("trace_id");
            entity.Property(item => item.Username).HasColumnName("username");
            entity.Property(item => item.Method).HasColumnName("method");
            entity.Property(item => item.Path).HasColumnName("path");
            entity.Property(item => item.QueryString).HasColumnName("query_string");
            entity.Property(item => item.RequestBody).HasColumnName("request_body");
            entity.Property(item => item.Status).HasColumnName("status");
            entity.Property(item => item.DurationMs).HasColumnName("duration_ms");
            entity.Property(item => item.Ip).HasColumnName("ip");
            entity.Property(item => item.CreateTime).HasColumnName("create_time");
        });
    }

    public override int SaveChanges()
    {
        ApplyAuditAndVersion();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndVersion();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// The Java reference uses JPA auditing and @Version. We apply the same rules here:
    /// create/update timestamps and a monotonically increasing optimistic-lock version.
    /// </summary>
    private void ApplyAuditAndVersion()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    SetIfExists(entry.Entity, "CreateTime", now);
                    SetIfExists(entry.Entity, "UpdateTime", now);
                    break;
                case EntityState.Modified:
                    SetIfExists(entry.Entity, "UpdateTime", now);
                    var version = entry.Entity.GetType().GetProperty("Version");
                    if (version?.PropertyType == typeof(int) && version.CanWrite)
                    {
                        version.SetValue(entry.Entity, (int)(version.GetValue(entry.Entity) ?? 0) + 1);
                    }
                    break;
            }
        }
    }

    private static void SetIfExists(object entity, string propertyName, DateTimeOffset value)
    {
        var property = entity.GetType().GetProperty(propertyName);
        if (property?.CanWrite == true && property.PropertyType == typeof(DateTimeOffset?))
        {
            property.SetValue(entity, value);
        }
    }
}
