using System.Text.RegularExpressions;

namespace Orange.Api.Domain;

/// <summary>
/// Validation and lookup rules for localized permission names.
///
/// Name resolution order: exact locale (case-insensitive), then the language
/// part before <c>-</c>, then the default <c>sys_permission.name</c>.
/// </summary>
public static class PermissionI18nPolicy
{
    /// <summary>Matches the length of <c>sys_permission_i18n.name</c>.</summary>
    public const int NameMaxLength = 255;

    private static readonly Regex LocalePattern = new(
        "^[a-z]{2}(-[A-Za-z]{2})?$",
        RegexOptions.CultureInvariant);

    /// <summary>
    /// Validates the request map and trims its keys and values. Language tags
    /// must look like <c>zh</c> or <c>en-US</c>; names must be non-blank and at
    /// most <see cref="NameMaxLength"/> characters.
    /// </summary>
    public static Dictionary<string, string> Normalize(
        IReadOnlyDictionary<string, string>? translations)
    {
        var normalized = new Dictionary<string, string>(StringComparer.Ordinal);
        if (translations is null || translations.Count == 0)
        {
            return normalized;
        }

        foreach (var (rawLocale, rawName) in translations)
        {
            var locale = (rawLocale ?? "").Trim();
            if (!LocalePattern.IsMatch(locale))
            {
                throw new BusinessException("语言标签格式不正确");
            }

            var name = (rawName ?? "").Trim();
            if (name.Length == 0)
            {
                throw new BusinessException("本地化名称不能为空");
            }
            if (name.Length > NameMaxLength)
            {
                throw new BusinessException($"本地化名称长度不能超过 {NameMaxLength}");
            }

            normalized[locale] = name;
        }

        return normalized;
    }

    /// <summary>
    /// Extracts the first candidate from a Locale header, dropping any quality
    /// weights and later candidates: <c>en-US,en;q=0.9</c> becomes <c>en-US</c>.
    /// </summary>
    public static string? PrimaryLocale(string? localeHeader)
    {
        if (string.IsNullOrWhiteSpace(localeHeader))
        {
            return null;
        }

        var firstCandidate = localeHeader.Split(',', 2)[0];
        var tag = firstCandidate.Split(';', 2)[0].Trim();
        return tag.Length == 0 || tag == "*" ? null : tag;
    }

    /// <summary>
    /// Resolves a permission's display name for the given Locale header.
    /// Returns <paramref name="defaultName"/> when no usable translation exists.
    /// </summary>
    public static string? Resolve(
        string? localeHeader,
        IReadOnlyDictionary<string, string>? translations,
        string? defaultName)
    {
        var locale = PrimaryLocale(localeHeader);
        if (locale is null || translations is null || translations.Count == 0)
        {
            return defaultName;
        }

        if (TryFind(translations, locale, out var exact))
        {
            return exact;
        }

        var separator = locale.IndexOf('-');
        if (separator > 0 && TryFind(translations, locale[..separator], out var language))
        {
            return language;
        }

        return defaultName;
    }

    private static bool TryFind(
        IReadOnlyDictionary<string, string> translations,
        string locale,
        out string name)
    {
        foreach (var (key, value) in translations)
        {
            if (string.Equals(key, locale, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(value))
            {
                name = value;
                return true;
            }
        }

        name = "";
        return false;
    }
}
