using Microsoft.AspNetCore.Mvc;
using Orange.Api.Contracts;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Controllers;

[ApiController]
[Route("api/v1/system/groups")]
public sealed class GroupController : ControllerBase
{
    private const string MenuAuthority = "menu#/system/group";
    private const string AddAuthority = "action#/system/group:add";
    private const string EditAuthority = "action#/system/group:edit";
    private const string DeleteAuthority = "action#/system/group:delete";

    private readonly GroupService _groupService;
    private readonly ApiResponseFactory _responses;

    public GroupController(GroupService groupService, ApiResponseFactory responses)
    {
        _groupService = groupService;
        _responses = responses;
    }

    [HttpGet]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<List<GroupBean>>> Query(
        [FromQuery] QueryGroupRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _groupService.QueryAsync(request, cancellationToken));

    [HttpGet("{groupId}")]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<GroupBean>> Get(string groupId, CancellationToken cancellationToken)
        => _responses.Ok(await _groupService.GetAsync(groupId, cancellationToken));

    [HttpPatch("{groupId}")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> Edit(
        string groupId,
        [FromBody] EditGroupRequest request,
        CancellationToken cancellationToken)
    {
        await _groupService.EditAsync(groupId, request.Name, request.Status, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpPatch("{groupId}/status")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> UpdateStatus(
        string groupId,
        [FromBody] StatusRequest request,
        CancellationToken cancellationToken)
    {
        await _groupService.EditAsync(groupId, null, request.Status, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpPost("children")]
    [RequireAuthority(AddAuthority)]
    public async Task<ApiResponse<GroupBean>> AddChild(
        [FromBody] AddChildGroupRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _groupService.AddChildAsync(request, cancellationToken));

    [HttpDelete("{groupId}")]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> Delete(string groupId, CancellationToken cancellationToken)
    {
        await _groupService.DeleteAsync(new[] { groupId }, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpDelete]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> DeleteMany(
        [FromQuery] string? ids,
        CancellationToken cancellationToken)
    {
        await _groupService.DeleteAsync(UserController.ParseIds(ids), cancellationToken);
        return _responses.Ok("操作成功");
    }
}
