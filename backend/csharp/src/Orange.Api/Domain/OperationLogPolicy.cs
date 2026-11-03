using System.Text.RegularExpressions;

namespace Orange.Api.Domain;

/// <summary>
/// Which requests are audited, which fields are redacted, how values are truncated,
/// and how the client IP is resolved. Pure static rules, unit-testable.
/// </summary>
public static partial class OperationLogPolicy
{
    public const int QueryLimit = 500;
    public const int BodyLimit = 4000;

    [GeneratedRegex("(?i)(\"[^\"]*(?:password|token|secret)[^\"]*\"\\s*:\\s*)\"(?:[^\"\\\\]|\\\\.)*\"")]
    private static partial Regex SensitiveJsonField();

    public static bool ShouldRecord(string method, string path)
    {
        if (string.Equals(method, "GET", StringComparison.OrdinalIgnoreCase)
            || string.Equals(method, "OPTIONS", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }
        return path.StartsWith("/api/v1/system/", StringComparison.Ordinal)
            || path.Equals("/api/v1/auth/change-password", StringComparison.Ordinal);
    }

    public static bool IsSensitivePath(string path)
    {
        var lower = path.ToLowerInvariant();
        return lower.EndsWith("/login", StringComparison.Ordinal)
            || lower.EndsWith("/refresh", StringComparison.Ordinal)
            || lower.EndsWith("/change-password", StringComparison.Ordinal)
            || lower.EndsWith("/reset-password", StringComparison.Ordinal);
    }

    public static string? SanitizeBody(string? body)
    {
        if (body is null)
        {
            return null;
        }
        var redacted = SensitiveJsonField().Replace(body, "${1}\"***\"");
        return redacted.Length <= BodyLimit ? redacted : redacted[..BodyLimit];
    }

    public static string? TruncateQuery(string? query)
    {
        if (query is null || query.Length <= QueryLimit)
        {
            return query;
        }
        return query[..QueryLimit];
    }

    public static string ClientIp(string? forwardedFor, string? remoteIp)
    {
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            var comma = forwardedFor.IndexOf(',');
            return (comma >= 0 ? forwardedFor[..comma] : forwardedFor).Trim();
        }
        return remoteIp ?? "";
    }
}
