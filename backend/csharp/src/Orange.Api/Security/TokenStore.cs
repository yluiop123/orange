using Microsoft.EntityFrameworkCore;
using Orange.Api.Data;
using Orange.Api.Domain;

namespace Orange.Api.Security;

/// <summary>jti revocation for refresh rotation, logout and password changes.</summary>
public sealed class TokenStore
{
    private readonly OrangeDbContext _db;

    public TokenStore(OrangeDbContext db)
    {
        _db = db;
    }

    public async Task<bool> IsRevokedAsync(string? jti, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(jti))
        {
            return false;
        }
        return await _db.RevokedTokens.AsNoTracking().AnyAsync(item => item.Jti == jti, cancellationToken);
    }

    /// <summary>
    /// Inserts the jti atomically. Returns false when it was already revoked,
    /// which lets refresh replay detection stay race-free.
    /// </summary>
    public async Task<bool> RevokeAsync(
        string? jti,
        string tokenType,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(jti) || expiresAt == default)
        {
            return false;
        }
        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"delete from sys_revoked_token where expires_at < {DateTimeOffset.UtcNow}", cancellationToken);
        var inserted = await _db.Database.ExecuteSqlInterpolatedAsync(
            $"""
             insert into sys_revoked_token (jti, token_type, expires_at, create_time)
             values ({jti}, {tokenType}, {expiresAt}, {DateTimeOffset.UtcNow})
             on conflict (jti) do nothing
             """, cancellationToken);
        return inserted > 0;
    }
}
