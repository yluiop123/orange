package com.orange.service.system.impl;

import com.orange.domain.common.PageData;
import com.orange.domain.system.operationlog.req.QueryOperationLogReq;
import com.orange.domain.system.operationlog.resp.OperationLogBean;
import com.orange.service.system.OperationLogService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class OperationLogServiceImpl implements OperationLogService {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public OperationLogServiceImpl(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public PageData<OperationLogBean> queryOperationLogs(QueryOperationLogReq req) {
        int page = req.getPage() == null ? 1 : req.getPage();
        int size = req.getSize() == null ? 10 : req.getSize();
        List<String> conditions = new ArrayList<>();
        MapSqlParameterSource params = new MapSqlParameterSource();

        if (StringUtils.isNotBlank(req.getUsername())) {
            conditions.add("strpos(lower(username), lower(:username)) > 0");
            params.addValue("username", req.getUsername().trim());
        }
        if (StringUtils.isNotBlank(req.getPath())) {
            conditions.add("strpos(lower(path), lower(:path)) > 0");
            params.addValue("path", req.getPath().trim());
        }
        if (StringUtils.isNotBlank(req.getStatus())) {
            conditions.add("status = :status");
            params.addValue("status", Integer.parseInt(req.getStatus()));
        }
        if (req.getFrom() != null) {
            conditions.add("create_time >= :from");
            params.addValue("from", req.getFrom());
        }
        if (req.getTo() != null) {
            conditions.add("create_time <= :to");
            params.addValue("to", req.getTo());
        }

        String where = conditions.isEmpty() ? "" : " where " + String.join(" and ", conditions);
        Long total = jdbcTemplate.queryForObject(
                "select count(*) from sys_operation_log" + where, params, Long.class);
        long totalValue = total == null ? 0 : total;

        params.addValue("limit", size);
        params.addValue("offset", (long) (page - 1) * size);
        List<OperationLogBean> list = jdbcTemplate.query(
                "select id, trace_id, username, method, path, query_string, request_body,"
                        + " status, duration_ms, ip, create_time"
                        + " from sys_operation_log" + where
                        + " order by id desc limit :limit offset :offset",
                params,
                (rs, rowNum) -> {
                    OperationLogBean bean = new OperationLogBean();
                    bean.setId(rs.getLong("id"));
                    bean.setTraceId(rs.getString("trace_id"));
                    bean.setUsername(rs.getString("username"));
                    bean.setMethod(rs.getString("method"));
                    bean.setPath(rs.getString("path"));
                    bean.setQueryString(rs.getString("query_string"));
                    bean.setRequestBody(rs.getString("request_body"));
                    bean.setStatus(rs.getInt("status"));
                    bean.setDurationMs(rs.getLong("duration_ms"));
                    bean.setIp(rs.getString("ip"));
                    bean.setCreateTime(rs.getObject("create_time", java.time.OffsetDateTime.class));
                    return bean;
                });

        int totalPages = totalValue == 0 ? 0 : (int) Math.ceil((double) totalValue / size);
        return new PageData<>(totalValue, list, page, size, totalPages);
    }
}
