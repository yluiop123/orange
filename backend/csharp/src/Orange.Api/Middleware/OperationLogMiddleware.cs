using System.Diagnostics;
using System.Text;
using Orange.Api.Domain;
using Orange.Api.Security;
using Orange.Api.Services;

namespace Orange.Api.Middleware;

/// <summary>
/// Audits non-GET writes to /api/v1/system/* and /auth/change-password.
/// Sensitive bodies (login, refresh, change/reset password) are never stored.
/// </summary>
public sealed class OperationLogMiddleware
{
    private const int BodyCacheLimit = 8192;
    private readonly RequestDelegate _next;
    private readonly ILogger<OperationLogMiddleware> _logger;

    public OperationLogMiddleware(RequestDelegate next, ILogger<OperationLogMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        OperationLogWriter operationLogWriter,
        CurrentUserAccessor currentUser)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? "";
        if (!OperationLogPolicy.ShouldRecord(method, path))
        {
            await _next(context);
            return;
        }

        var started = Stopwatch.GetTimestamp();
        string? body = null;
        if (!OperationLogPolicy.IsSensitivePath(path) && IsJson(context.Request.ContentType))
        {
            body = await ReadBodyAsync(context.Request);
        }

        try
        {
            await _next(context);
        }
        finally
        {
            var elapsed = Stopwatch.GetElapsedTime(started);
            var entry = new OperationLogEntry
            {
                TraceId = TraceContext.Get(context),
                Username = currentUser.Current?.Username ?? "anonymous",
                Method = method,
                Path = path,
                QueryString = OperationLogPolicy.TruncateQuery(context.Request.QueryString.Value),
                RequestBody = OperationLogPolicy.SanitizeBody(body),
                Status = context.Response.StatusCode,
                DurationMs = (long)elapsed.TotalMilliseconds,
                Ip = OperationLogPolicy.ClientIp(
                    context.Request.Headers["X-Forwarded-For"].ToString(),
                    context.Connection.RemoteIpAddress?.ToString()),
                CreateTime = DateTimeOffset.UtcNow
            };
            try
            {
                await operationLogWriter.RecordAsync(entry, CancellationToken.None);
            }
            catch (Exception exception)
            {
                _logger.LogWarning("Failed to write operation log: {Message}", exception.Message);
            }
        }
    }

    private static bool IsJson(string? contentType)
        => contentType is not null && contentType.Contains("json", StringComparison.OrdinalIgnoreCase);

    private static async Task<string?> ReadBodyAsync(HttpRequest request)
    {
        request.EnableBuffering();
        var buffer = new byte[BodyCacheLimit];
        var total = 0;
        while (total < buffer.Length)
        {
            var read = await request.Body.ReadAsync(buffer.AsMemory(total, buffer.Length - total));
            if (read == 0)
            {
                break;
            }
            total += read;
        }
        request.Body.Position = 0;
        return total == 0 ? null : Encoding.UTF8.GetString(buffer, 0, total);
    }
}
