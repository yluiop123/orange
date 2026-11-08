package com.orange.security;

import com.orange.domain.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Enforces the authority declared by {@code @PreAuthorize} before Spring MVC
 * resolves and validates method arguments.
 *
 * <p>Method security runs on the controller proxy, which is invoked after
 * argument resolution, so a caller without the authority would otherwise get
 * {@code 40001}/{@code 40002} for a malformed body before {@code 40301}. A
 * {@link HandlerInterceptor} runs before argument resolution and keeps the
 * documented pipeline intact. The annotation stays in place as defence in
 * depth.</p>
 */
@Component
public class AuthorityInterceptor implements HandlerInterceptor {

    private static final Pattern HAS_AUTHORITY =
            Pattern.compile("hasAuthority\\('([^']+)'\\)");

    private final SecurityResponseWriter responseWriter;

    public AuthorityInterceptor(SecurityResponseWriter responseWriter) {
        this.responseWriter = responseWriter;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws IOException {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }
        PreAuthorize annotation = handlerMethod.getMethodAnnotation(PreAuthorize.class);
        if (annotation == null) {
            return true;
        }

        Set<String> granted = authorities();
        Matcher matcher = HAS_AUTHORITY.matcher(annotation.value());
        while (matcher.find()) {
            if (!granted.contains(matcher.group(1))) {
                responseWriter.write(response, ErrorCode.AUTH_DENIED);
                return false;
            }
        }
        return true;
    }

    private Set<String> authorities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Set.of();
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toUnmodifiableSet());
    }
}
