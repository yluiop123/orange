package com.orange.domain.system.permission;

import com.orange.domain.common.BusinessException;
import org.apache.commons.lang3.StringUtils;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 权限本地化名称的校验与解析规则。
 *
 * <p>名称回退顺序：精确 locale（忽略大小写）→ locale 语言部分（{@code -} 之前）→ 权限默认名称。</p>
 */
public final class PermissionI18nPolicy {

    /** 与 sys_permission_i18n.name 的列长度保持一致。 */
    public static final int NAME_MAX_LENGTH = 255;

    private static final Pattern LOCALE_PATTERN =
            Pattern.compile("^[a-z]{2}(-[A-Za-z]{2})?$", Pattern.CASE_INSENSITIVE);

    private PermissionI18nPolicy() {
    }

    /**
     * 校验并规范化请求中的翻译表：语言标签统一为 {@code en} / {@code en-US}，
     * 名称去除首尾空白；任一键或值非法都按 40002 校验失败处理。
     */
    public static Map<String, String> normalize(Map<String, String> translations) {
        Map<String, String> normalized = new LinkedHashMap<>();
        if (translations == null || translations.isEmpty()) {
            return normalized;
        }
        for (Map.Entry<String, String> entry : translations.entrySet()) {
            String locale = canonicalLocale(entry.getKey());
            String name = entry.getValue() == null ? "" : entry.getValue().trim();
            if (StringUtils.isBlank(name)) {
                throw new BusinessException("本地化名称不能为空");
            }
            if (name.length() > NAME_MAX_LENGTH) {
                throw new BusinessException("本地化名称长度不能超过 " + NAME_MAX_LENGTH);
            }
            normalized.put(locale, name);
        }
        return normalized;
    }

    /** 语言标签规范化为“语言小写 + 地区大写”，与数据库大小写不敏感的排序规则兼容。 */
    static String canonicalLocale(String rawLocale) {
        String locale = rawLocale == null ? "" : rawLocale.trim();
        if (!LOCALE_PATTERN.matcher(locale).matches()) {
            throw new BusinessException("语言标签格式不正确");
        }
        int separator = locale.indexOf('-');
        if (separator < 0) {
            return locale.toLowerCase(Locale.ROOT);
        }
        return locale.substring(0, separator).toLowerCase(Locale.ROOT)
                + "-"
                + locale.substring(separator + 1).toUpperCase(Locale.ROOT);
    }

    /**
     * 从 Locale 请求头解析出主语言标签，忽略 {@code q} 权重与后续候选。
     * 例如 {@code en-US,en;q=0.9} → {@code en-US}。
     */
    public static String primaryLocale(String localeHeader) {
        if (StringUtils.isBlank(localeHeader)) {
            return null;
        }
        String firstCandidate = localeHeader.split(",", 2)[0];
        String tag = firstCandidate.split(";", 2)[0].trim();
        if (tag.isEmpty() || "*".equals(tag)) {
            return null;
        }
        return tag;
    }

    /**
     * 按回退顺序解析权限显示名称。
     *
     * @param localeHeader Locale 请求头，可为空
     * @param translations locale -> 本地化名称
     * @param defaultName  权限默认名称
     */
    public static String resolve(String localeHeader,
                                 Map<String, String> translations,
                                 String defaultName) {
        String locale = primaryLocale(localeHeader);
        if (locale == null || translations == null || translations.isEmpty()) {
            return defaultName;
        }
        String exact = find(translations, locale);
        if (exact != null) {
            return exact;
        }
        int separator = locale.indexOf('-');
        if (separator > 0) {
            String language = find(translations, locale.substring(0, separator));
            if (language != null) {
                return language;
            }
        }
        return defaultName;
    }

    private static String find(Map<String, String> translations, String locale) {
        for (Map.Entry<String, String> entry : translations.entrySet()) {
            if (entry.getKey() != null
                    && entry.getKey().equalsIgnoreCase(locale)
                    && StringUtils.isNotBlank(entry.getValue())) {
                return entry.getValue();
            }
        }
        return null;
    }
}
