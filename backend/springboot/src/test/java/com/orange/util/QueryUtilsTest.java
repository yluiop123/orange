package com.orange.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QueryUtilsTest {

    @Test
    void prefixPatternEscapesLikeWildcardsWithPortableEscapeCharacter() {
        assertThat(QueryUtils.likePrefix("Admin_%!"))
                .isEqualTo("admin!_!%!!%");
        assertThat(QueryUtils.likePrefix(null)).isEqualTo("%");
        assertThat(QueryUtils.LIKE_ESCAPE).isEqualTo('!');
    }

    @Test
    void containsPatternKeepsWildcardsAroundTheEscapedValue() {
        assertThat(QueryUtils.likeContains("a_b%c"))
                .isEqualTo("%a!_b!%c%");
    }
}
