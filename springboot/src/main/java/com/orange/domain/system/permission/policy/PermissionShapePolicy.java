package com.orange.domain.system.permission.policy;

import com.orange.domain.common.BusinessException;
import org.apache.commons.lang3.StringUtils;

/**
 * 权限 type 与 action 的组合规则。
 * action 权限必须有 action；menu/directory 权限不能有 action。
 */
public final class PermissionShapePolicy {

    private PermissionShapePolicy() {
    }

    public static void validate(String type, String action) {
        if ("action".equals(type)) {
            if (StringUtils.isBlank(action)) {
                throw new BusinessException("action 类型的权限必须填写 action");
            }
            return;
        }
        if ("menu".equals(type) || "directory".equals(type)) {
            if (StringUtils.isNotBlank(action)) {
                throw new BusinessException("menu/directory 类型的权限不能填写 action");
            }
        }
    }
}
