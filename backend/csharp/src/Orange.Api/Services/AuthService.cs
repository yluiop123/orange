using Microsoft.EntityFrameworkCore;
using Orange.Api.Data;
using Orange.Api.Domain;
using Orange.Api.Security;

namespace Orange.Api.Services;

public sealed record TokenPair(string AccessToken, string RefreshToken);

public sealed class AuthService
{
    private readonly OrangeDbContext _db;
    private readonly PasswordHasher _passwordHasher;
    private readonly JwtService _jwt;
    private readonly TokenStore _tokenStore;
    private readonly LoginAttemptService _loginAttempts;

    public AuthService(
        OrangeDbContext db,
        PasswordHasher passwordHasher,
        JwtService jwt,
        TokenStore tokenStore,
        LoginAttemptService loginAttempts)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwt = jwt;
        _tokenStore = tokenStore;
        _loginAttempts = loginAttempts;
    }

    public async Task<TokenPair> LoginAsync(
        string username,
        string password,
        string? ip,
        CancellationToken cancellationToken)
    {
        if (await _loginAttempts.IsBlockedAsync(ip, username, cancellationToken))
        {
            throw new RateLimitedException("登录失败次数过多，请稍后再试");
        }

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Username == username, cancellationToken);
        var passwordOk = user is not null && _passwordHasher.Verify(password, user.Password);
        if (user is null || !passwordOk || user.Status == EffectivePermissions.StatusDisabled)
        {
            await _loginAttempts.OnFailureAsync(ip, username, cancellationToken);
            // Same message for unknown user and wrong password, to avoid enumeration.
            throw new UnauthorizedException("用户名或密码错误");
        }

        await _loginAttempts.OnSuccessAsync(ip, username, cancellationToken);
        return new TokenPair(
            _jwt.GenerateAccessToken(user.Id, user.Username, user.TokenVersion),
            _jwt.GenerateRefreshToken(user.Id, user.Username, user.TokenVersion));
    }

    /// <summary>
    /// Rotates the refresh token: the old jti is revoked atomically, so replaying the
    /// previous cookie fails with 401 even when two requests race.
    /// </summary>
    public async Task<TokenPair> RefreshAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedException("未登录");
        }

        JwtClaims claims;
        try
        {
            claims = _jwt.ParseRefreshToken(refreshToken);
        }
        catch
        {
            throw new UnauthorizedException("登录已过期");
        }

        if (await _tokenStore.IsRevokedAsync(claims.Jti, cancellationToken))
        {
            throw new UnauthorizedException("登录已过期");
        }

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Username == claims.Username, cancellationToken);
        if (user is null
            || user.Status == EffectivePermissions.StatusDisabled
            || user.TokenVersion != claims.Version
            || user.Id != claims.Subject
            || user.Username != claims.Username)
        {
            throw new UnauthorizedException("登录已过期");
        }

        var revoked = await _tokenStore.RevokeAsync(
            claims.Jti, "refresh", claims.ExpiresAt, cancellationToken);
        if (!revoked)
        {
            throw new UnauthorizedException("登录已过期");
        }

        return new TokenPair(
            _jwt.GenerateAccessToken(user.Id, user.Username, user.TokenVersion),
            _jwt.GenerateRefreshToken(user.Id, user.Username, user.TokenVersion));
    }

    /// <summary>
    /// Revokes the refresh jti when present, revokes the access jti, and bumps
    /// token_version so every other session for the user is invalidated.
    /// </summary>
    public async Task LogoutAsync(
        string? refreshToken,
        CurrentUser? current,
        JwtClaims? accessClaims,
        CancellationToken cancellationToken)
    {
        string? username = null;
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            try
            {
                var refreshClaims = _jwt.ParseRefreshToken(refreshToken);
                username = refreshClaims.Username;
                await _tokenStore.RevokeAsync(
                    refreshClaims.Jti, "refresh", refreshClaims.ExpiresAt, cancellationToken);
            }
            catch
            {
                // An invalid refresh cookie must not prevent logout.
            }
        }

        if (accessClaims is not null)
        {
            await _tokenStore.RevokeAsync(
                accessClaims.Jti, "access", accessClaims.ExpiresAt, cancellationToken);
        }

        username ??= current?.Username;
        if (username is not null)
        {
            var user = await _db.Users.FirstOrDefaultAsync(
                item => item.Username == username, cancellationToken);
            if (user is not null)
            {
                user.TokenVersion += 1;
                await _db.SaveChangesAsync(cancellationToken);
            }
        }
    }
}
