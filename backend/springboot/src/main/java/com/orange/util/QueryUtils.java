package com.orange.util;

import java.util.Locale;

/**
 * 查询参数工具：把用户输入转成安全的 LIKE 模式。
 * 转义 {@code !}、{@code %} 和 {@code _}，避免用户输入被当成通配符。
 *
 * <p>使用 {@code !} 而不是反斜杠作为转义符：MySQL 字符串字面量里反斜杠本身
 * 需要再转义，而 {@code !} 在 PostgreSQL、MySQL/MariaDB 和 SQLite 上都是普通字符。
 * 调用方必须把 {@link #LIKE_ESCAPE} 传给 {@code LIKE ... ESCAPE}。</p>
 */
public final class QueryUtils {

    public static final char LIKE_ESCAPE = '!';

    private QueryUtils() {
    }

    public static String likePrefix(String value) {
        return escape(value) + "%";
    }

    public static String likeContains(String value) {
        return "%" + escape(value) + "%";
    }

    private static String escape(String value) {
        String input = value == null ? "" : value;
        return input.toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }
}
