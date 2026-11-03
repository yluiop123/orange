using System.Text.Json;
using Orange.Api.Contracts;

namespace Orange.Api.Security;

/// <summary>Per-request trace id, reused by the envelope, the header and the operation log.</summary>
public static class TraceContext
{
    public const string ItemKey = "orange.traceId";
    public const string Header = "X-Trace-Id";
    public const string LegacyHeader = "X-Request-Id";

    public static string Get(HttpContext context)
        => context.Items.TryGetValue(ItemKey, out var value) && value is string traceId
            ? traceId
            : "";

    public static string NewId() => Guid.NewGuid().ToString("N")[..16];
}

/// <summary>Builds the canonical envelope. Every response uses this type.</summary>
public sealed class ApiResponseFactory
{
    private readonly IHttpContextAccessor _accessor;

    public ApiResponseFactory(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public ApiResponse<T> Ok<T>(T data)
        => new()
        {
            Code = Domain.ErrorCodes.Success,
            Message = data is string text ? text : "",
            Data = data,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            TraceId = TraceId
        };

    public ApiResponse<T> Ok<T>(string message, T data)
        => new()
        {
            Code = Domain.ErrorCodes.Success,
            Message = message,
            Data = data,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            TraceId = TraceId
        };

    public ApiResponse<object?> Error(int code, string message, object? data = null)
        => new()
        {
            Code = code,
            Message = message,
            Data = data,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            TraceId = TraceId
        };

    private string TraceId
        => _accessor.HttpContext is { } context ? TraceContext.Get(context) : TraceContext.NewId();
}

/// <summary>
/// Writes the envelope directly from middleware, where MVC's serialization pipeline is not available.
/// </summary>
public static class ApiResponseWriter
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public static async Task WriteAsync(
        HttpContext context,
        int code,
        string message,
        object? data = null)
    {
        if (context.Response.HasStarted)
        {
            return;
        }
        var traceId = TraceContext.Get(context);
        if (string.IsNullOrEmpty(traceId))
        {
            traceId = TraceContext.NewId();
            context.Items[TraceContext.ItemKey] = traceId;
        }
        context.Response.Headers[TraceContext.Header] = traceId;
        context.Response.Headers[TraceContext.LegacyHeader] = traceId;
        context.Response.StatusCode = Domain.ErrorCodes.HttpStatusFor(code);
        context.Response.ContentType = "application/json; charset=utf-8";
        var envelope = new ApiResponse<object?>
        {
            Code = code,
            Message = message,
            Data = data,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            TraceId = traceId
        };
        await context.Response.WriteAsync(JsonSerializer.Serialize(envelope, JsonOptions));
    }
}
