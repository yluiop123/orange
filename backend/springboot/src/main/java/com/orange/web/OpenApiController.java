package com.orange.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 统一 Swagger 入口：/openapi.json 返回仓库根契约，/swagger 用 CDN 加载 Swagger UI。
 * springdoc 默认关闭，因此这两个端点替代其自动生成的文档。
 */
@Slf4j
@RestController
public class OpenApiController {

    /** 从进程 cwd 向上最多找 5 层，与其余五个后端的契约定位规则一致。 */
    private static final int MAX_ANCESTOR_LEVELS = 5;
    private static final String CONTRACT_RELATIVE_PATH = "contracts/openapi.json";

    private static final String SWAGGER_HTML = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Orange API</title>
              <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
            </head>
            <body>
              <div id="swagger-ui"></div>
              <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
              <script>
                SwaggerUIBundle({url:'/openapi.json', dom_id:'#swagger-ui', persistAuthorization:true, docExpansion:'none'});
              </script>
            </body>
            </html>
            """;

    /** 启动时读取一次，避免每个请求都走文件系统。 */
    private final String contract;

    public OpenApiController() {
        this.contract = readContract();
    }

    @GetMapping(value = "/openapi.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> openapiJson() {
        if (contract == null) {
            log.error("contracts/openapi.json not found within {} levels above {}",
                    MAX_ANCESTOR_LEVELS, Path.of("").toAbsolutePath());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\":\"contracts/openapi.json not found\"}");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(contract);
    }

    @GetMapping(value = "/swagger", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> swaggerUi() {
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
                .body(SWAGGER_HTML);
    }

    private static String readContract() {
        Path contract = locateContract();
        if (contract == null) {
            log.warn("contracts/openapi.json not found within {} levels above {}",
                    MAX_ANCESTOR_LEVELS, Path.of("").toAbsolutePath());
            return null;
        }
        try {
            return Files.readString(contract, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("failed to read {}", contract, e);
            return null;
        }
    }

    static Path locateContract() {
        Path directory = Path.of("").toAbsolutePath();
        for (int level = 0; level <= MAX_ANCESTOR_LEVELS; level++) {
            Path candidate = directory.resolve(CONTRACT_RELATIVE_PATH);
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
            directory = directory.getParent();
            if (directory == null) {
                break;
            }
        }
        return null;
    }
}
