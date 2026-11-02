package com.orange.service.system;

import com.orange.domain.common.PageData;
import com.orange.domain.system.operationlog.req.QueryOperationLogReq;
import com.orange.domain.system.operationlog.resp.OperationLogBean;

public interface OperationLogService {

    PageData<OperationLogBean> queryOperationLogs(QueryOperationLogReq req);
}
