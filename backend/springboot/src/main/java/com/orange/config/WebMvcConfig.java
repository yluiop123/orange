package com.orange.config;

import com.orange.security.AuthorityInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AuthorityInterceptor authorityInterceptor;
    private final OperationLogInterceptor operationLogInterceptor;

    public WebMvcConfig(AuthorityInterceptor authorityInterceptor,
                        OperationLogInterceptor operationLogInterceptor) {
        this.authorityInterceptor = authorityInterceptor;
        this.operationLogInterceptor = operationLogInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Authorization must run before argument resolution (and therefore
        // before DTO validation); the operation log only records timings.
        registry.addInterceptor(authorityInterceptor)
                .addPathPatterns("/api/**")
                .order(0);
        registry.addInterceptor(operationLogInterceptor)
                .addPathPatterns("/api/**")
                .order(1);
    }
}
