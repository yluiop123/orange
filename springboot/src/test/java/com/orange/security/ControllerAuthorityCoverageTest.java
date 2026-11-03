package com.orange.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class ControllerAuthorityCoverageTest {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Pattern AUTHORITY = Pattern.compile("hasAuthority\\('([^']+)'\\)");

    @Test
    void everyPreAuthorizeAuthorityExistsInCatalog() throws Exception {
        Set<String> used = new HashSet<>();
        List<Path> controllers;
        try (Stream<Path> files = Files.walk(Path.of("src/main/java/com/orange/controller"))) {
            controllers = files.filter(path -> path.toString().endsWith(".java")).toList();
        }
        for (Path controller : controllers) {
            Matcher matcher = AUTHORITY.matcher(Files.readString(controller));
            while (matcher.find()) {
                used.add(matcher.group(1));
            }
        }

        assertThat(used).isNotEmpty();

        Set<String> catalog = new HashSet<>();
        JsonNode root = JSON.readTree(
                Path.of("../vite-shadcn/src/config/permissions.json").toFile());
        for (JsonNode permission : root.path("permissions")) {
            String type = permission.path("type").asText();
            String path = permission.path("path").asText();
            String action = permission.path("action").isNull()
                    ? ""
                    : permission.path("action").asText();
            catalog.add(type + "#" + path + (action.isBlank() ? "" : ":" + action));
        }

        assertThat(catalog).containsAll(used);
        for (String authority : used) {
            if (authority.startsWith("menu#")) {
                assertThat(authority).doesNotContain(":");
            }
            if (authority.startsWith("action#")) {
                assertThat(authority).contains(":");
            }
        }
    }
}
