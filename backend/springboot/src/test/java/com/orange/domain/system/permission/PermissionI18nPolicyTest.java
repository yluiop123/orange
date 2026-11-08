package com.orange.domain.system.permission;

import com.orange.domain.common.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PermissionI18nPolicyTest {

    @Test
    void resolvesExactLocaleCaseInsensitively() {
        Map<String, String> translations = new LinkedHashMap<>();
        translations.put("en", "Dashboard");
        translations.put("en-US", "US Dashboard");

        assertThat(PermissionI18nPolicy.resolve("en-US", translations, "仪表盘"))
                .isEqualTo("US Dashboard");
        assertThat(PermissionI18nPolicy.resolve("EN-us", translations, "仪表盘"))
                .isEqualTo("US Dashboard");
        assertThat(PermissionI18nPolicy.resolve("en-GB", translations, "仪表盘"))
                .isEqualTo("Dashboard");
    }

    @Test
    void fallsBackToLanguagePartBeforeDefaultName() {
        Map<String, String> translations = Map.of("en", "Users");

        assertThat(PermissionI18nPolicy.resolve("en-GB,en;q=0.9", translations, "用户管理"))
                .isEqualTo("Users");
        assertThat(PermissionI18nPolicy.resolve("EN-gb", translations, "用户管理"))
                .isEqualTo("Users");
    }

    @Test
    void fallsBackToDefaultNameWhenNothingMatches() {
        Map<String, String> translations = Map.of("en", "Users");

        assertThat(PermissionI18nPolicy.resolve("ja-JP", translations, "用户管理"))
                .isEqualTo("用户管理");
        assertThat(PermissionI18nPolicy.resolve(null, translations, "用户管理"))
                .isEqualTo("用户管理");
        assertThat(PermissionI18nPolicy.resolve("en", Map.of(), "用户管理"))
                .isEqualTo("用户管理");
        assertThat(PermissionI18nPolicy.resolve("*", translations, "用户管理"))
                .isEqualTo("用户管理");
    }

    @Test
    void canonicalizesLocaleKeysAndTrimsNames() {
        Map<String, String> normalized = PermissionI18nPolicy.normalize(
                Map.of(" EN-us ", "  Users  ", "zh-cn", "用户管理"));

        assertThat(normalized)
                .containsEntry("en-US", "Users")
                .containsEntry("zh-CN", "用户管理");
        assertThat(normalized).doesNotContainKey(" EN-us ");
    }

    @Test
    void rejectsInvalidLocaleKeys() {
        assertThatThrownBy(() -> PermissionI18nPolicy.normalize(Map.of("english", "Users")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("语言标签格式不正确");
        assertThatThrownBy(() -> PermissionI18nPolicy.normalize(Map.of("e", "Users")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("语言标签格式不正确");
        assertThatThrownBy(() -> PermissionI18nPolicy.normalize(Map.of("en-US-x", "Users")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("语言标签格式不正确");
    }

    @Test
    void rejectsBlankAndOversizedNames() {
        assertThatThrownBy(() -> PermissionI18nPolicy.normalize(Map.of("en", "   ")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("本地化名称不能为空");
        assertThatThrownBy(() -> PermissionI18nPolicy.normalize(Map.of("en", "x".repeat(256))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("本地化名称长度不能超过");
    }

    @Test
    void normalizationOfNullIsEmpty() {
        assertThat(PermissionI18nPolicy.normalize(null)).isEmpty();
    }
}
