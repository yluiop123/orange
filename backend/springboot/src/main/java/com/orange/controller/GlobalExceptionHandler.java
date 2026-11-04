package com.orange.controller;

import com.orange.domain.common.BusinessException;
import com.orange.domain.common.ErrorCode;
import com.orange.domain.common.Response;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;
import java.util.stream.Collectors;

import static com.orange.domain.common.ErrorCode.AUTH_DENIED;
import static com.orange.domain.common.ErrorCode.CONFLICT;
import static com.orange.domain.common.ErrorCode.METHOD_NOT_ALLOWED;
import static com.orange.domain.common.ErrorCode.NOT_FOUND;
import static com.orange.domain.common.ErrorCode.PARAM_ERROR;
import static com.orange.domain.common.ErrorCode.SYSTEM_ERROR;
import static com.orange.domain.common.ErrorCode.VALIDATE_ERROR;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 捕获自定义业务异常，返回业务方给出的原始提示，并映射为真实 HTTP 状态码
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Response<?>> handleBusinessException(BusinessException e) {
        String message = (e.getMessage() == null || e.getMessage().isBlank())
                ? VALIDATE_ERROR.getMessage()
                : e.getMessage();
        ErrorCode errorCode = resolveBusinessError(message);
        String traceId = Response.newTraceId();
        log.warn("Business exception [{}] traceId={}: {}", errorCode.getCode(), traceId, message);
        Response<?> body = Response.error(errorCode.getCode(), message);
        body.setTraceId(traceId);
        return ResponseEntity.status(errorCode.getHttpStatus()).body(body);
    }

    private ErrorCode resolveBusinessError(String message) {
        if (message.contains("不存在")) {
            return NOT_FOUND;
        }
        if (message.contains("已存在") || message.contains("已被") || message.contains("不能删除") || message.contains("请先禁用子组织")) {
            return CONFLICT;
        }
        return VALIDATE_ERROR;
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<Response<?>> handleAuthorizationDeniedException(AuthorizationDeniedException e) {
        String traceId = Response.newTraceId();
        log.warn("Access denied traceId={}: {}", traceId, e.getMessage());
        Response<?> body = Response.error(AUTH_DENIED);
        body.setTraceId(traceId);
        return ResponseEntity.status(AUTH_DENIED.getHttpStatus()).body(body);
    }

    // 捕获参数绑定异常（@Valid 校验失败）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Response<Map<String, String>>> handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> errors = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() == null
                                ? "invalid value"
                                : fieldError.getDefaultMessage(),
                        (existing, replacement) -> existing
                ));
        String traceId = Response.newTraceId();
        log.warn("Validation failed traceId={}: {}", traceId, errors);
        Response<Map<String, String>> body = Response.error(VALIDATE_ERROR.getCode(), VALIDATE_ERROR.getMessage(), errors);
        body.setTraceId(traceId);
        return ResponseEntity.status(PARAM_ERROR.getHttpStatus()).body(body);
    }

    // 请求体无法解析、缺少参数、参数类型不匹配
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<Response<?>> handleBadRequest(Exception e) {
        String traceId = Response.newTraceId();
        log.warn("Bad request traceId={}: {}", traceId, e.getMessage());
        Response<?> body = Response.error(PARAM_ERROR);
        body.setTraceId(traceId);
        return ResponseEntity.status(PARAM_ERROR.getHttpStatus()).body(body);
    }

    @ExceptionHandler({DataIntegrityViolationException.class, ObjectOptimisticLockingFailureException.class})
    public ResponseEntity<Response<?>> handleConflict(Exception e) {
        String traceId = Response.newTraceId();
        log.warn("Data conflict traceId={}: {}", traceId, e.getMessage());
        Response<?> body = Response.error(CONFLICT.getCode(), "数据冲突，请刷新后重试");
        body.setTraceId(traceId);
        return ResponseEntity.status(CONFLICT.getHttpStatus()).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Response<?>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        String traceId = Response.newTraceId();
        log.warn("Method not allowed traceId={}: {}", traceId, e.getMessage());
        Response<?> body = Response.error(METHOD_NOT_ALLOWED);
        body.setTraceId(traceId);
        return ResponseEntity.status(METHOD_NOT_ALLOWED.getHttpStatus()).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Response<?>> handleNoResource(NoResourceFoundException e) {
        String traceId = Response.newTraceId();
        log.warn("Resource not found traceId={}: {}", traceId, e.getMessage());
        Response<?> body = Response.error(NOT_FOUND);
        body.setTraceId(traceId);
        return ResponseEntity.status(NOT_FOUND.getHttpStatus()).body(body);
    }

    // 捕获未处理异常（系统异常）
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Response<?>> handleException(Exception e) {
        String traceId = Response.newTraceId();
        log.error("Unhandled exception traceId={}", traceId, e);
        Response<?> body = Response.error(SYSTEM_ERROR);
        body.setTraceId(traceId);
        return ResponseEntity.status(SYSTEM_ERROR.getHttpStatus()).body(body);
    }
}
