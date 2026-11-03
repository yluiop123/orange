package com.orange.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "bearerAuth"; // 定义方案名称

        return new OpenAPI()
                .info(new Info().title("API 接口文档").version("1.0"))
                // 1. 添加全局安全要求（让所有接口默认都显示锁图标）
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                // 2. 定义安全方案（说明 Authorization 是在 Header 中，且是 Bearer 格式）
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name("Authorization") // Header 的键名
                                        .type(SecurityScheme.Type.HTTP) // HTTP 类型
                                        .scheme("bearer")
                                        .bearerFormat("JWT"))); // 可选，标注是 JWT 格式
    }
}
