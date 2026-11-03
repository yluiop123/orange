package com.orange.controller.system;

import com.orange.domain.common.PageData;
import com.orange.domain.common.Response;
import com.orange.domain.system.operationlog.req.QueryOperationLogReq;
import com.orange.domain.system.operationlog.resp.OperationLogBean;
import com.orange.service.system.OperationLogRecorder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "操作日志", description = "系统管理写操作审计日志")
@RestController
@RequestMapping("/api/v1/system/operation-logs")
public class OperationLogController {

    @Autowired
    private OperationLogRecorder operationLogRecorder;

    @Operation(summary = "查询操作日志", description = "支持按操作人、路径、状态和时间范围过滤")
    @GetMapping
    @PreAuthorize("hasAuthority('menu#/system/operation-log')")
    public Response<PageData<OperationLogBean>> queryOperationLogs(
            @Valid @ModelAttribute QueryOperationLogReq req) {
        return Response.ok(operationLogRecorder.query(req));
    }
}
