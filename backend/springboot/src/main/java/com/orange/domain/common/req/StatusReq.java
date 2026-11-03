package com.orange.domain.common.req;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "状态更新请求体")
@Data
public class StatusReq {
    @Schema(description = "状态", example = "1", allowableValues = {"0", "1"})
    @NotBlank(message = "状态不能为空")
    @Pattern(regexp = "^(0|1)$", message = "状态只能是 0 或 1")
    private String status;
}
