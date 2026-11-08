using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Orange.Api.Contracts;
using Orange.Api.Domain;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly UserService _userService;
    private readonly MenuService _menuService;
    private readonly JwtService _jwt;
    private readonly RefreshCookieService _cookie;
    private readonly CurrentUserAccessor _currentUser;
    private readonly ApiResponseFactory _responses;

    public AuthController(
        AuthService authService,
        UserService userService,
        MenuService menuService,
        JwtService jwt,
        RefreshCookieService cookie,
        CurrentUserAccessor currentUser,
        ApiResponseFactory responses)
    {
        _authService = authService;
        _userService = userService;
        _menuService = menuService;
        _jwt = jwt;
        _cookie = cookie;
        _currentUser = currentUser;
        _responses = responses;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ApiResponse<LoginResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var ip = OperationLogPolicy.ClientIp(
            Request.Headers["X-Forwarded-For"].ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString());
        TokenPair tokens;
        try
        {
            tokens = await _authService.LoginAsync(
                request.Username, request.Password, ip, cancellationToken);
        }
        catch (UnauthorizedException)
        {
            // Same contract as the other stacks: a failed login also clears any
            // stale refresh cookie the browser still holds.
            _cookie.Clear(Response);
            throw;
        }
        _cookie.Set(Response, tokens.RefreshToken);
        return _responses.Ok(new LoginResponse
        {
            Token = tokens.AccessToken,
            Status = "ok",
            ExpiresIn = _jwt.AccessExpireSeconds,
            RefreshExpiresIn = _jwt.RefreshExpireSeconds
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ApiResponse<LoginResponse>> Refresh(CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshCookieService.Name];
        try
        {
            var tokens = await _authService.RefreshAsync(refreshToken, cancellationToken);
            _cookie.Set(Response, tokens.RefreshToken);
            return _responses.Ok(new LoginResponse
            {
                Token = tokens.AccessToken,
                Status = "ok",
                ExpiresIn = _jwt.AccessExpireSeconds,
                RefreshExpiresIn = _jwt.RefreshExpireSeconds
            });
        }
        catch
        {
            // A failed refresh always clears the stale cookie.
            _cookie.Clear(Response);
            throw;
        }
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ApiResponse<string>> Logout(CancellationToken cancellationToken)
    {
        var accessClaims = HttpContext.Items["orange.jwtClaims"] as JwtClaims;
        await _authService.LogoutAsync(
            Request.Cookies[RefreshCookieService.Name],
            _currentUser.Current,
            accessClaims,
            cancellationToken);
        _cookie.Clear(Response);
        return _responses.Ok("ok");
    }

    [HttpGet("user-info")]
    public async Task<ApiResponse<UserInfoResponse>> UserInfo(CancellationToken cancellationToken)
    {
        var current = _currentUser.Require();
        return _responses.Ok(await _userService.GetUserInfoAsync(current.UserId, cancellationToken));
    }

    [HttpPost("change-password")]
    public async Task<ApiResponse<string>> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var current = _currentUser.Require();
        await _userService.ChangePasswordAsync(
            current.Username, request.OldPassword, request.NewPassword, cancellationToken);
        _cookie.Clear(Response);
        return _responses.Ok("密码已修改，请重新登录");
    }

    [HttpGet("menus")]
    public async Task<ApiResponse<List<MenuInfo>>> Menus(CancellationToken cancellationToken)
        => _responses.Ok(await _menuService.QueryTreeAsync(Request.Headers["Locale"], cancellationToken));
}
