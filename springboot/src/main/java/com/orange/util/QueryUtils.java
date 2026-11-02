package com.orange.util;

/**
 * 查询参数工具：把用户输入转成安全的 LIKE 前缀模式。
 * 转义 \、% 和 _，避免用户输入被当成通配符。
 */
public final class QueryUtils {

    private QueryUtils() {
    }

    public static String likePrefix(String value) {
        String input = value == null ? "" : value;
        String escaped = input.toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return escaped + "%";
    }
}
