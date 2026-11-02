package com.orange.domain.common;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.orange.util.TraceId;

import static com.orange.domain.common.ErrorCode.SUCCESS;

@Schema(description = "通用响应体")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Response<T> {
    @Schema(description = "状态码", example = "200")
    private Integer code;
    @Schema(description = "状态信息", example = "操作成功")
    private String message;
    @Schema(description = "数据")
    private T data;
    @Schema(description = "时间戳", example = "1694502400000")
    private long timestamp;
    @Schema(description = "链路追踪 ID", example = "9f8c1b2d3e4f5a6b")
    private String traceId;

    public static <T> Response<T> ok(T data) {
        if (data instanceof String) {
            return new Response<>(SUCCESS.getCode(), (String) data, data, System.currentTimeMillis(), null);
        }
        return new Response<>(SUCCESS.getCode(), "", data, System.currentTimeMillis(), null);
    }

    public static <T> Response<T> ok(String message, T data) {
        return new Response<>(SUCCESS.getCode(), message, data, System.currentTimeMillis(), null);
    }

    public static <T> Response<T> error(int code, String message) {
        Response<T> r = new Response<>();
        r.code = code;
        r.message = message;
        r.timestamp = System.currentTimeMillis();
        r.traceId = newTraceId();
        return r;
    }
    public static <T> Response<T> error(ErrorCode errorCode) {
        return error(errorCode.getCode(), errorCode.getMessage());
    }
    public static <T> Response<T> error(int code, String message, T data) {
        Response<T> r = new Response<>();
        r.code = code;
        r.message = message;
        r.data = data;
        r.timestamp = System.currentTimeMillis();
        r.traceId = newTraceId();
        return r;
    }

    public static String newTraceId() {
        return TraceId.currentOrNew();
    }
}
