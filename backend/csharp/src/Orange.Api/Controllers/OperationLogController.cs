using Microsoft.AspNetCore.Mvc;
using Orange.Api.Contracts;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Controllers;

[ApiController]
[Route("api/v1/system/operation-logs")]
public sealed class OperationLogController : ControllerBase
{
    private readonly OperationLogService _operationLogs;
    private readonly ApiResponseFactory _responses;

    public OperationLogController(OperationLogService operationLogs, ApiResponseFactory responses)
    {
        _operationLogs = operationLogs;
        _responses = responses;
    }

    [HttpGet]
    [RequireAuthority("menu#/system/operation-log")]
    public async Task<ApiResponse<PageData<OperationLogBean>>> Query(
        [FromQuery] QueryOperationLogRequest request,
        CancellationToken cancellationToken)
        => _responses.Ok(await _operationLogs.QueryAsync(request, cancellationToken));
}
