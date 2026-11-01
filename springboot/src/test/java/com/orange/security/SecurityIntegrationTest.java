package com.orange.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orange.entity.User;
import com.orange.repository.system.UserRepository;
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
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private UserRepository userRepository;

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
        ResponseEntity<String> response = rest.getForEntity("/api/user/userInfo", String.class);

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

        assertThat(authorizedGet("/api/user/userInfo", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> menus = authorizedGet("/api/user/menus", login.token());
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

        assertThat(authorizedPost("/api/user/logout", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(authorizedGet("/api/user/userInfo", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void normalUserCannotCallSystemApi() throws Exception {
        Login login = login("user", "user");

        ResponseEntity<String> denied = authorizedGet("/api/system/users?page=1&size=1", login.token());

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
        assertThat(authorizedGet("/api/user/userInfo", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(authorizedGet("/api/user/menus", login.token()).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<String> blocked = authorizedGet("/api/system/users?page=1&size=1", login.token());
        assertThat(blocked.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(blocked.getBody()).contains("\"code\":40302");
    }

    private Login login(String username, String password) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
                JSON.writeValueAsString(Map.of("username", username, "password", password)), headers);
        ResponseEntity<String> response = rest.postForEntity("/api/user/login", request, String.class);
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
        return rest.exchange("/api/user/refresh", HttpMethod.POST, new HttpEntity<>(headers), String.class);
    }

    private record Login(HttpStatusCode status, String token, String refreshCookie, JsonNode body) {
    }
}
