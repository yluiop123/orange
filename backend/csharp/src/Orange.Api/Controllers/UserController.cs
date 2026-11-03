using Microsoft.AspNetCore.Mvc;
using Orange.Api.Contracts;
using Orange.Api.Domain;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Controllers;

[ApiController]
[Route("api/v1/system/users")]
public sealed class UserController : ControllerBase
{
    private const string MenuAuthority = "menu#/system/user";
    private const string AddAuthority = "action#/system/user:add";
    private const string EditAuthority = "action#/system/user:edit";
    private const string DeleteAuthority = "action#/system/user:delete";

    private readonly UserService _userService;
    private readonly ApiResponseFactory _responses;

    public UserController(UserService userService, ApiResponseFactory responses)
    {
        _userService = userService;
        _responses = responses;
    }

    [HttpGet]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<PageData<UserBean>>> Query(
        [FromQuery] QueryUserRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _userService.QueryAsync(request, cancellationToken));

    [HttpGet("{userId}")]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<UserBean>> Get(string userId, CancellationToken cancellationToken)
        => _responses.Ok(await _userService.GetAsync(userId, cancellationToken));

    [HttpPost]
    [RequireAuthority(AddAuthority)]
    public async Task<ApiResponse<string>> Add(
        [FromBody] AddUserRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok("操作成功", await _userService.AddAsync(request, cancellationToken));

    [HttpPatch("{userId}")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> Edit(
        string userId,
        [FromBody] EditUserRequest request,
        CancellationToken cancellationToken)
    {
        await _userService.EditAsync(userId, request, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpPatch("{userId}/status")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> UpdateStatus(
        string userId,
        [FromBody] StatusRequest request,
        CancellationToken cancellationToken)
    {
        await _userService.UpdateStatusAsync(userId, request.Status, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpPost("{userId}/reset-password")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> ResetPassword(string userId, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        return _responses.Ok("操作成功", await _userService.ResetPasswordAsync(userId, cancellationToken));
    }

    [HttpDelete("{userId}")]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> Delete(string userId, CancellationToken cancellationToken)
    {
        await _userService.DeleteAsync(new[] { userId }, cancellationToken);
        return _responses.Ok("删除成功");
    }

    [HttpDelete]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> DeleteMany(
        [FromQuery] string? ids,
        CancellationToken cancellationToken)
    {
        await _userService.DeleteAsync(ParseIds(ids), cancellationToken);
        return _responses.Ok("删除成功");
    }

    internal static List<string> ParseIds(string? ids)
    {
        if (ids is null)
        {
            throw new BadRequestException(ErrorCodes.ParamErrorMessage);
        }
        return ids.Split(',')
            .Select(id => id.Trim())
            .Where(id => id.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}
