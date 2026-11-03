using Microsoft.AspNetCore.Mvc;
using Orange.Api.Contracts;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Controllers;

[ApiController]
[Route("api/v1/system/permissions")]
public sealed class PermissionController : ControllerBase
{
    private const string MenuAuthority = "menu#/system/permission";
    private const string AddAuthority = "action#/system/permission:add";
    private const string EditAuthority = "action#/system/permission:edit";
    private const string DeleteAuthority = "action#/system/permission:delete";

    private readonly PermissionService _permissionService;
    private readonly ApiResponseFactory _responses;

    public PermissionController(PermissionService permissionService, ApiResponseFactory responses)
    {
        _permissionService = permissionService;
        _responses = responses;
    }

    [HttpGet]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<List<PermissionBean>>> Query(
        [FromQuery] QueryPermissionRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _permissionService.QueryAsync(request, cancellationToken));

    [HttpGet("{permissionId}")]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<PermissionBean>> Get(string permissionId, CancellationToken cancellationToken)
        => _responses.Ok(await _permissionService.GetAsync(permissionId, cancellationToken));

    [HttpPatch("{permissionId}")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> Edit(
        string permissionId,
        [FromBody] EditPermissionRequest request,
        CancellationToken cancellationToken)
    {
        await _permissionService.EditAsync(permissionId, request, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpPost("children")]
    [RequireAuthority(AddAuthority)]
    public async Task<ApiResponse<PermissionBean>> AddChild(
        [FromBody] AddChildPermissionRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _permissionService.AddChildAsync(request, cancellationToken));

    [HttpDelete("{permissionId}")]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> Delete(string permissionId, CancellationToken cancellationToken)
    {
        await _permissionService.DeleteAsync(new[] { permissionId }, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpDelete]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> DeleteMany(
        [FromQuery] string? ids,
        CancellationToken cancellationToken)
    {
        await _permissionService.DeleteAsync(UserController.ParseIds(ids), cancellationToken);
        return _responses.Ok("操作成功");
    }
}
