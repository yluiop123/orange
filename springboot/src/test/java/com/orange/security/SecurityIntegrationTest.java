package com.orange.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orange.entity.Group;
import com.orange.entity.Permission;
import com.orange.entity.Role;
import com.orange.entity.User;
import com.orange.repository.system.GroupRepository;
import com.orange.repository.system.PermissionRepository;
import com.orange.repository.system.RoleRepository;
import com.orange.repository.system.UserRepository;
import com.orange.service.system.GroupService;
import com.orange.service.system.PermissionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 真实 HTTP + 真实 PostgreSQL 的安全集成测试。
 * 菜单、权限、登录限流、refresh 轮换都走完整过滤器链。
 */
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class SecurityIntegrationTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.sql.init.mode", () -> "always");
        registry.add("spring.sql.init.schema-locations", () -> "file:../database/postgres/ddl.sql");
        registry.add("spring.sql.init.data-locations", () -> "file:../database/postgres/dml.sql");
        registry.add("spring.sql.init.encoding", () -> "UTF-8");
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("springdoc.api-docs.enabled", () -> "true");
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String createdUsername;

    @AfterEach
    void cleanup() {
        if (createdUsername != null) {
            User created = userRepository.findByUsername(createdUsername);
            if (created != null) {
                userRepository.delete(created);
            }
            createdUsername = null;
        }
    }

    @Test
    void unauthenticatedRequestsUseUnified401() {
        ResponseEntity<String> response = rest.getForEntity("/api/v1/auth/user-info", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).contains("\"code\":40101").contains("\"traceId\"");
    }

    @Test
    void loginReturnsTokenAndMenuTree() throws Exception {
        Login login = login("super", "super");

        assertThat(login.status()).isEqualTo(HttpStatus.OK);
        assertThat(login.token()).isNotBlank();
        assertThat(login.refreshCookie()).startsWith("refresh_token=");
        assertThat(login.body().path("data").path("expiresIn").asLong()).isPositive();

        assertThat(authorizedGet("/api/v1/auth/user-info", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> menus = authorizedGet("/api/v1/auth/menus", login.token());
        assertThat(menus.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode roots = JSON.readTree(menus.getBody()).path("data");
        assertThat(roots.isArray()).isTrue();
        assertThat(roots.size()).isEqualTo(6);
        assertThat(roots.get(0).path("path").asText()).isEqualTo("/dashboard");
    }

    @Test
    void refreshTokenRotationRejectsReplay() throws Exception {
        Login login = login("super", "super");

        ResponseEntity<String> refreshed = refresh(login.refreshCookie());
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshed.getHeaders().get(HttpHeaders.SET_COOKIE)).isNotEmpty();

        ResponseEntity<String> replay = refresh(login.refreshCookie());
        assertThat(replay.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(replay.getBody()).contains("\"code\":40101");
    }

    @Test
    void logoutRevokesAccessToken() throws Exception {
        Login login = login("super", "super");

        assertThat(authorizedPost("/api/v1/auth/logout", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(authorizedGet("/api/v1/auth/user-info", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void normalUserCannotCallSystemApi() throws Exception {
        Login login = login("user", "user");

        ResponseEntity<String> denied = authorizedGet("/api/v1/system/users?page=1&size=1", login.token());

        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody()).contains("\"code\":40301");
    }

    @Test
    void mustChangePasswordBlocksOtherEndpoints() throws Exception {
        createdUsername = "itmust" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        User user = new User();
        user.setUsername(createdUsername);
        user.setName("Must Change");
        user.setEmail(createdUsername + "@example.com");
        user.setGroupId("00");
        user.setStatus("1");
        user.setPassword(passwordEncoder.encode("TempPass123"));
        user.setTokenVersion(0);
        user.setMustChangePassword(true);
        userRepository.save(user);

        Login login = login(createdUsername, "TempPass123");

        assertThat(login.status()).isEqualTo(HttpStatus.OK);
        assertThat(authorizedGet("/api/v1/auth/user-info", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(authorizedGet("/api/v1/auth/menus", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> blocked = authorizedGet("/api/v1/system/users?page=1&size=1", login.token());
        assertThat(blocked.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(blocked.getBody()).contains("\"code\":40302");
    }

    @Test
    void deletingPermissionSubtreeChecksReferencesAndRemovesDescendants() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String rootId = String.format("9%03d", Math.floorMod(suffix.hashCode(), 1000));
        String childId = rootId + "01";
        String grandChildId = childId + "01";
        Permission root = permission(rootId, null, "/it/permission/" + suffix);
        Permission child = permission(childId, rootId, "/it/permission/" + suffix + "/child");
        Permission grandChild = permission(grandChildId, childId, "/it/permission/" + suffix + "/grand");
        permissionRepository.saveAll(List.of(root, child, grandChild));

        Role role = new Role();
        role.setId("r" + suffix);
        role.setName("Integration Role " + suffix);
        role.setStatus("1");
        role.getPermissions().add(child);
        Role savedRole = roleRepository.save(role);
        try {
            assertThatThrownBy(() -> permissionService.deletePermissions(List.of(rootId)))
                    .hasMessageContaining("已被角色引用");

            Role managedRole = roleRepository.findWithAllAttributesById(savedRole.getId());
            managedRole.getPermissions().clear();
            roleRepository.save(managedRole);

            permissionService.deletePermissions(List.of(rootId));

            assertThat(permissionRepository.findById(rootId)).isEmpty();
            assertThat(permissionRepository.findById(childId)).isEmpty();
            assertThat(permissionRepository.findById(grandChildId)).isEmpty();
        } finally {
            Role cleanupRole = roleRepository.findWithAllAttributesById(savedRole.getId());
            if (cleanupRole != null) {
                cleanupRole.getPermissions().clear();
                roleRepository.save(cleanupRole);
                roleRepository.delete(cleanupRole);
            }
            if (permissionRepository.existsById(rootId)) {
                permissionService.deletePermissions(List.of(rootId));
            }
        }
    }

    @Test
    void deletingGroupSubtreeChecksDescendantUsers() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        String rootId = String.format("9%d", Math.floorMod(suffix.hashCode(), 10));
        String childId = rootId + "01";
        groupRepository.saveAll(List.of(
                group(rootId, null, "Integration Group " + suffix),
                group(childId, rootId, "Integration Child " + suffix)));

        User user = new User();
        user.setUsername("itgrp" + suffix);
        user.setName("Group User");
        user.setGroupId(childId);
        user.setStatus("1");
        User savedUser = userRepository.save(user);
        try {
            assertThatThrownBy(() -> groupService.deleteGroups(List.of(rootId)))
                    .hasMessageContaining("下有用户");

            userRepository.delete(savedUser);
            groupService.deleteGroups(List.of(rootId));

            assertThat(groupRepository.findById(rootId)).isEmpty();
            assertThat(groupRepository.findById(childId)).isEmpty();
        } finally {
            User remaining = userRepository.findByUsername("itgrp" + suffix);
            if (remaining != null) {
                userRepository.delete(remaining);
            }
            if (groupRepository.existsById(rootId)) {
                groupService.deleteGroups(List.of(rootId));
            }
        }
    }

    @Test
    void cannotDisableCurrentUser() throws Exception {
        Login login = login("super", "super");
        JsonNode info = JSON.readTree(authorizedGet("/api/v1/auth/user-info", login.token()).getBody());
        String userId = info.path("data").path("id").asText();

        ResponseEntity<String> response = authorizedJson(
                "PATCH", "/api/v1/system/users/" + userId, login.token(), Map.of("status", "0"));

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getBody()).contains("不能禁用当前登录用户");
        assertThat(JSON.readTree(authorizedGet("/api/v1/auth/user-info", login.token()).getBody())
                .path("data").path("status").asText()).isEqualTo("1");
    }

    @Test
    void adminCannotResetSuperPassword() throws Exception {
        Login admin = login("admin", "admin");
        ResponseEntity<String> search = authorizedGet(
                "/api/v1/system/users?page=1&size=10&keyword=super&groupId=",
                admin.token());
        String superId = JSON.readTree(search.getBody()).path("data").path("list").get(0).path("id").asText();

        ResponseEntity<String> response = authorizedPost(
                "/api/v1/system/users/" + superId + "/reset-password", admin.token());

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getBody()).contains("无权重置超级管理员密码");
    }

    @Test
    void adminCannotAssignSuperRole() throws Exception {
        Login admin = login("admin", "admin");
        String username = "itgrant" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        createdUsername = username;

        ResponseEntity<String> response = authorizedJson("POST", "/api/v1/system/users", admin.token(), Map.of(
                "name", "Grant Test",
                "username", username,
                "email", username + "@example.com",
                "groupId", "0001",
                "phone", "13900000099",
                "status", "1",
                "roles", List.of("super"),
                "permissions", List.of()));

        assertThat(response.getStatusCode().is4xxClientError()).isTrue();
        assertThat(response.getBody()).contains("只有超级管理员可以授予 super 角色");
    }

    @Test
    void traceIdHeaderIsReusedInErrorResponse() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Request-Id", "trace-test-1234");

        ResponseEntity<String> response = rest.exchange(
                "/api/v1/auth/user-info", HttpMethod.GET, new HttpEntity<>(headers), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getHeaders().getFirst("X-Request-Id")).isEqualTo("trace-test-1234");
        assertThat(response.getBody()).contains("\"traceId\":\"trace-test-1234\"");
    }

    @Test
    void openApiSpecIsAvailable() throws Exception {
        ResponseEntity<String> response = rest.getForEntity("/api-docs", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("\"openapi\"");

        String snapshot = System.getProperty("openapi.snapshot");
        if (snapshot != null && !snapshot.isBlank()) {
            // 随机端口会让快照每次都变，生成时固定为相对地址
            com.fasterxml.jackson.databind.node.ObjectNode root =
                    (com.fasterxml.jackson.databind.node.ObjectNode) JSON.readTree(response.getBody());
            root.putArray("servers").addObject().put("url", "/");
            java.nio.file.Files.writeString(
                    java.nio.file.Path.of(snapshot), JSON.writeValueAsString(root));
        }
    }

    @Test
    void operationLogRecordsTraceIdBodyAndPath() throws Exception {
        Login login = login("super", "super");
        String traceId = "oplog" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(login.token());
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Request-Id", traceId);

        ResponseEntity<String> created = rest.exchange(
                "/api/v1/system/groups/children",
                HttpMethod.POST,
                new HttpEntity<>(JSON.writeValueAsString(Map.of("id", "97", "name", "Log Test")), headers),
                String.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);

        try {
            ResponseEntity<String> logs = authorizedGet(
                    "/api/v1/system/operation-logs?path=/api/v1/system/groups&size=20", login.token());

            assertThat(logs.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(logs.getBody())
                    .contains(traceId)
                    .contains("/api/v1/system/groups/children")
                    .contains("Log Test")
                    .contains("\"username\":\"super\"");
        } finally {
            if (groupRepository.existsById("97")) {
                groupRepository.deleteById("97");
            }
        }
    }

    private ResponseEntity<String> authorizedJson(String method, String path, String token, Object body)
            throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, HttpMethod.valueOf(method),
                new HttpEntity<>(JSON.writeValueAsString(body), headers), String.class);
    }

    private Permission permission(String id, String parentId, String path) {
        Permission permission = new Permission();
        permission.setId(id);
        permission.setName("Integration " + id);
        permission.setPath(path);
        permission.setType("menu");
        permission.setStatus("1");
        permission.setParentId(parentId);
        return permission;
    }

    private Group group(String id, String parentId, String name) {
        Group group = new Group();
        group.setId(id);
        group.setName(name);
        group.setParentId(parentId);
        group.setStatus("1");
        return group;
    }

    private Login login(String username, String password) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
                JSON.writeValueAsString(Map.of("username", username, "password", password)), headers);
        ResponseEntity<String> response = rest.postForEntity("/api/v1/auth/login", request, String.class);
        JsonNode body = JSON.readTree(response.getBody());
        String token = body.path("data").path("token").asText(null);
        String refreshCookie = response.getHeaders()
                .getOrDefault(HttpHeaders.SET_COOKIE, List.of())
                .stream()
                .filter(value -> value.startsWith("refresh_token="))
                .findFirst()
                .map(value -> value.split(";", 2)[0])
                .orElse(null);
        return new Login(response.getStatusCode(), token, refreshCookie, body);
    }

    private ResponseEntity<String> authorizedGet(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return rest.exchange(path, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    private ResponseEntity<String> authorizedPost(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return rest.exchange(path, HttpMethod.POST, new HttpEntity<>(headers), String.class);
    }

    private ResponseEntity<String> refresh(String cookie) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.COOKIE, cookie);
        return rest.exchange("/api/v1/auth/refresh", HttpMethod.POST, new HttpEntity<>(headers), String.class);
    }

    private record Login(HttpStatusCode status, String token, String refreshCookie, JsonNode body) {
    }
}
