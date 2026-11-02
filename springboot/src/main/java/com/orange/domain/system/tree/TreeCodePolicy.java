package com.orange.domain.system.tree;

import com.orange.domain.common.BusinessException;
import org.apache.commons.lang3.StringUtils;

/**
 * Business Code 的唯一后端规则。
 * 根编码长度由资源类型决定，子编码 = 父编码 + 2 位数字；编码一旦创建不可修改。
 */
public record TreeCodePolicy(int rootLength, int segmentLength, String label) {

    public static final TreeCodePolicy GROUP = new TreeCodePolicy(2, 2, "组织");
    public static final TreeCodePolicy PERMISSION = new TreeCodePolicy(4, 2, "权限");

    public void validate(String id, String parentId) {
        if (StringUtils.isBlank(id)) {
            throw new BusinessException(label + "编码不能为空");
        }
        if (!id.matches("^[0-9]+$")) {
            throw new BusinessException(label + "编码只能包含数字");
        }
        String parent = StringUtils.trimToNull(parentId);
        if (parent == null) {
            if (id.length() != rootLength) {
                throw new BusinessException("根" + label + "编码长度必须为" + rootLength);
            }
            return;
        }
        int expectedLength = parent.length() + segmentLength;
        if (id.length() != expectedLength) {
            throw new BusinessException(label + "编码长度必须为" + expectedLength);
        }
        if (!id.startsWith(parent)) {
            throw new BusinessException(label + "编码必须以" + parent + "开头");
        }
    }
}
