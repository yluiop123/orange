namespace Orange.Api.Services;

public static class QueryUtils
{
    /// <summary>
    /// Escapes \, % and _ and appends %, so user input is a literal prefix rather than
    /// a wildcard. Used with ILIKE, matching the reference's lower(...) LIKE behavior.
    /// </summary>
    public static string LikePrefix(string? value)
    {
        var input = Escape(value);
        return input + "%";
    }

    /// <summary>Literal substring pattern for audit-log filters.</summary>
    public static string LikeContains(string? value)
    {
        var input = Escape(value);
        return "%" + input + "%";
    }

    private static string Escape(string? value)
        => (value ?? "").ToLowerInvariant()
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");

    public static string? TrimToNull(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public static class Pagination
{
    public const int DefaultPage = 1;
    public const int DefaultSize = 10;

    public static (int Page, int Size, int Skip) Resolve(int? page, int? size)
    {
        var resolvedPage = page is null or < 1 ? DefaultPage : page.Value;
        var resolvedSize = size is null or < 1 ? DefaultSize : size.Value;
        return (resolvedPage, resolvedSize, (resolvedPage - 1) * resolvedSize);
    }
}
