using Microsoft.AspNetCore.Authorization;
using Orange.Api.Domain;

namespace Orange.Api.Security;

/// <summary>
/// Authenticates every request that carries a bearer token, then enforces the rules that
/// the Java filter enforces before controllers: login required, forced password change,
/// and the endpoint's declared authority.
/// </summary>
public sealed class AuthenticationMiddleware
{
    private static readonly HashSet<string> AllowedBeforePasswordChange = new(StringComparer.Ordinal)
    {
        "/api/v1/auth/change-password",
        "/api/v1/auth/user-info",
        "/api/v1/auth/menus",
        "/api/v1/auth/logout"
    };

    private readonly RequestDelegate _next;

    public AuthenticationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(
        HttpContext context,
        JwtService jwt,
        TokenStore tokenStore,
        UserLoader userLoader,
        ILogger<AuthenticationMiddleware> logger)
    {
        var claims = await ResolveAsync(context, jwt, tokenStore, userLoader, logger);
        if (claims is not null)
        {
            context.Items[CurrentUserAccessor.ItemKey] = claims.CurrentUser;
            context.Items["orange.jwtClaims"] = claims.Jwt;
        }

        var endpoint = context.GetEndpoint();
        var allowAnonymous = endpoint?.Metadata.GetMetadata<IAllowAnonymous>() is not null
            || HttpMethods.IsOptions(context.Request.Method);

        if (claims is null)
        {
            if (!allowAnonymous)
            {
                await ApiResponseWriter.WriteAsync(
                    context, ErrorCodes.Unauthorized, ErrorCodes.UnauthorizedMessage);
                return;
            }
            await _next(context);
            return;
        }

        var current = claims.CurrentUser;
        if (current.MustChangePassword && !AllowedBeforePasswordChange.Contains(context.Request.Path.Value ?? ""))
        {
            await ApiResponseWriter.WriteAsync(
                context, ErrorCodes.PasswordChangeRequired, ErrorCodes.PasswordChangeRequiredMessage);
            return;
        }

        var required = endpoint?.Metadata.GetMetadata<RequireAuthorityAttribute>();
        if (required is not null && !current.Authorities.Contains(required.Authority))
        {
            await ApiResponseWriter.WriteAsync(context, ErrorCodes.Forbidden, ErrorCodes.ForbiddenMessage);
            return;
        }

        await _next(context);
    }

    private static async Task<Authenticated?> ResolveAsync(
        HttpContext context,
        JwtService jwt,
        TokenStore tokenStore,
        UserLoader userLoader,
        ILogger logger)
    {
        var header = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(header) || !header.StartsWith("Bearer ", StringComparison.Ordinal))
        {
            return null;
        }
        var token = header["Bearer ".Length..];
        try
        {
            var claims = jwt.ParseAccessToken(token);
            if (await tokenStore.IsRevokedAsync(claims.Jti, context.RequestAborted))
            {
                return null;
            }
            var loaded = await userLoader.LoadByUsernameAsync(claims.Username, context.RequestAborted);
            if (loaded is null)
            {
                return null;
            }
            var user = loaded.User;
            if (user.Status == EffectivePermissions.StatusDisabled)
            {
                return null;
            }
            if (claims.Version != user.TokenVersion
                || claims.Subject != user.Id
                || claims.Username != user.Username)
            {
                return null;
            }
            var authorities = new HashSet<string>(loaded.Effective.Authorities, StringComparer.Ordinal);
            foreach (var role in loaded.Effective.Roles)
            {
                authorities.Add("ROLE_" + role.Id);
            }
            var current = new CurrentUser(
                user.Id,
                user.Username,
                user.TokenVersion,
                user.MustChangePassword,
                authorities,
                claims);
            return new Authenticated(claims, current);
        }
        catch (Exception exception) when (exception is ArgumentException or FormatException or KeyNotFoundException)
        {
            logger.LogInformation("JWT authentication failed: {Message}", exception.Message);
            return null;
        }
    }

    private sealed record Authenticated(JwtClaims Jwt, CurrentUser CurrentUser);
}
