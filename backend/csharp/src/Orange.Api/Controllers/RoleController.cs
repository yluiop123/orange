using Microsoft.AspNetCore.Mvc;
using Orange.Api.Contracts;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Controllers;

[ApiController]
[Route("api/v1/system/roles")]
public sealed class RoleController : ControllerBase
{
    private const string MenuAuthority = "menu#/system/role";
    private const string AddAuthority = "action#/system/role:add";
    private const string EditAuthority = "action#/system/role:edit";
    private const string DeleteAuthority = "action#/system/role:delete";

    private readonly RoleService _roleService;
    private readonly ApiResponseFactory _responses;

    public RoleController(RoleService roleService, ApiResponseFactory responses)
    {
        _roleService = roleService;
        _responses = responses;
    }

    [HttpGet]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<PageData<RoleBean>>> Query(
        [FromQuery] QueryRoleRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _roleService.QueryAsync(request, cancellationToken));

    [HttpGet("{roleId}")]
    [RequireAuthority(MenuAuthority)]
    public async Task<ApiResponse<RoleBean>> Get(string roleId, CancellationToken cancellationToken)
        => _responses.Ok(await _roleService.GetAsync(roleId, cancellationToken));

    [HttpPost]
    [RequireAuthority(AddAuthority)]
    public async Task<ApiResponse<string>> Add(
        [FromBody] AddRoleRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok("操作成功", await _roleService.AddAsync(request, cancellationToken));

    [HttpPatch("{roleId}")]
    [RequireAuthority(EditAuthority)]
    public async Task<ApiResponse<string>> Edit(
        string roleId,
        [FromBody] EditRoleRequest request,
        CancellationToken cancellationToken)
    {
        await _roleService.EditAsync(roleId, request, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpDelete("{roleId}")]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> Delete(string roleId, CancellationToken cancellationToken)
    {
        await _roleService.DeleteAsync(new[] { roleId }, cancellationToken);
        return _responses.Ok("操作成功");
    }

    [HttpDelete]
    [RequireAuthority(DeleteAuthority)]
    public async Task<ApiResponse<string>> DeleteMany(
        [FromQuery] string? ids,
        CancellationToken cancellationToken)
    {
        await _roleService.DeleteAsync(UserController.ParseIds(ids), cancellationToken);
        return _responses.Ok("操作成功");
    }
}
