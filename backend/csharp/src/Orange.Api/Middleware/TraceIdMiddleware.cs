using System.Text.RegularExpressions;
using Orange.Api.Security;

namespace Orange.Api.Middleware;

/// <summary>
/// Accepts or generates X-Trace-Id, stores it for the request, and returns it in both
/// X-Trace-Id and the legacy X-Request-Id response header.
/// </summary>
public sealed class TraceIdMiddleware
{
    private static readonly Regex SafeTraceId = new("^[A-Za-z0-9._-]{8,64}$", RegexOptions.Compiled);
    private readonly RequestDelegate _next;

    public TraceIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var incoming = context.Request.Headers[TraceContext.Header].ToString();
        if (string.IsNullOrWhiteSpace(incoming))
        {
            incoming = context.Request.Headers[TraceContext.LegacyHeader].ToString();
        }
        var traceId = !string.IsNullOrWhiteSpace(incoming) && SafeTraceId.IsMatch(incoming)
            ? incoming
            : TraceContext.NewId();

        context.Items[TraceContext.ItemKey] = traceId;
        context.Response.Headers[TraceContext.Header] = traceId;
        context.Response.Headers[TraceContext.LegacyHeader] = traceId;
        await _next(context);
    }
}
