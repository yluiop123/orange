package com.orange.domain.system.tree;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orange.domain.common.BusinessException;
import com.orange.domain.system.permission.policy.PermissionShapePolicy;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TreeCodePolicyTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Test
    void groupPolicyMatchesSharedFixture() throws Exception {
        JsonNode fixture = fixture();
        JsonNode policy = fixture.path("policy").path("group");

        assertThat(TreeCodePolicy.GROUP.rootLength()).isEqualTo(policy.path("rootLength").asInt());
        assertThat(TreeCodePolicy.GROUP.segmentLength()).isEqualTo(policy.path("segmentLength").asInt());
        assertFixture(TreeCodePolicy.GROUP, fixture.path("group"));
    }

    @Test
    void permissionPolicyMatchesSharedFixture() throws Exception {
        JsonNode fixture = fixture();
        JsonNode policy = fixture.path("policy").path("permission");

        assertThat(TreeCodePolicy.PERMISSION.rootLength()).isEqualTo(policy.path("rootLength").asInt());
        assertThat(TreeCodePolicy.PERMISSION.segmentLength()).isEqualTo(policy.path("segmentLength").asInt());
        assertFixture(TreeCodePolicy.PERMISSION, fixture.path("permission"));
    }

    @Test
    void permissionShapeMatchesSharedFixture() throws Exception {
        JsonNode shape = fixture().path("permissionShape");

        for (JsonNode entry : shape.path("valid")) {
            String type = entry.path("type").asText();
            String action = entry.path("action").isNull() ? null : entry.path("action").asText();
            assertThatCode(() -> PermissionShapePolicy.validate(type, action))
                    .doesNotThrowAnyException();
        }

        for (JsonNode entry : shape.path("invalid")) {
            String type = entry.path("type").asText();
            String action = entry.path("action").isNull() ? null : entry.path("action").asText();
            assertThatThrownBy(() -> PermissionShapePolicy.validate(type, action))
                    .isInstanceOf(BusinessException.class);
        }
    }

    private static void assertFixture(TreeCodePolicy policy, JsonNode section) {
        for (JsonNode entry : section.path("valid")) {
            String id = entry.path("id").asText();
            String parentId = entry.path("parentId").isNull() ? null : entry.path("parentId").asText();
            assertThatCode(() -> policy.validate(id, parentId)).doesNotThrowAnyException();
        }

        for (JsonNode entry : section.path("invalid")) {
            String id = entry.path("id").asText();
            String parentId = entry.path("parentId").isNull() ? null : entry.path("parentId").asText();
            assertThatThrownBy(() -> policy.validate(id, parentId))
                    .isInstanceOf(BusinessException.class);
        }
    }

    private static JsonNode fixture() throws Exception {
        return JSON.readTree(Path.of("../../frontend/react/src/config/tree-code-policy.fixture.json").toFile());
    }
}
