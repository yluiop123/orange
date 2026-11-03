import { listPermissions } from "@/api/system/permission";
import type { Permission } from "@/api/system/permission";
import { buildChildrenTree } from "@/components/system/resource-list/tree";
import type { Status } from "@/lib/status";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import TreeSelect, { TreeNode } from "./ext/tree-select";
import { useReferenceData } from "./ext/use-reference-data";

type PermissionTreeSelectProps = {
  value: string;
  onChange: (ids: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeId?: string;
};

export type PermissionNode = TreeNode & {
  parentId?: string | null;
  status?: Status;
  type?: "menu" | "directory" | "action";
};

function excludedPermissionIds(
  permissions: Permission[],
  excludeId?: string,
): Set<string> {
  const excluded = new Set<string>();
  if (!excludeId) {
    return excluded;
  }
  excluded.add(excludeId);
  let changed = true;
  while (changed) {
    changed = false;
    for (const permission of permissions) {
      if (
        permission.parentId
        && excluded.has(permission.parentId)
        && !excluded.has(permission.id)
      ) {
        excluded.add(permission.id);
        changed = true;
      }
    }
  }
  return excluded;
}

export default function PermissionTreeSelect({
  onChange: onChangeHandle,
  placeholder,
  excludeId,
  ...props
}: PermissionTreeSelectProps) {
  const intl = useIntl();
  const disabledLabel = intl.formatMessage({ id: "dict.status.disabled" });
  const actionLabel = intl.formatMessage({ id: "dict.permissionType.action" });
  const { data, loading } = useReferenceData(async (signal) => {
    const permissions = await listPermissions(undefined, signal);
    const excluded = excludedPermissionIds(permissions, excludeId);
    return permissions.filter((permission) => !excluded.has(permission.id));
  }, excludeId);

  const treeData = useMemo(
    () =>
      buildChildrenTree(
        data.map((permission) => {
          const isDisabled = permission.status === "0";
          const isAction = permission.type === "action";
          return {
            ...permission,
            value: permission.id,
            title: permission.name,
            disabled: isDisabled || isAction,
            disabledLabel: isDisabled
              ? disabledLabel
              : isAction
                ? actionLabel
                : undefined,
          };
        }),
        { id: (node) => node.value, parentId: (node) => node.parentId },
      ),
    [actionLabel, data, disabledLabel],
  );

  return (
    <TreeSelect
      data={treeData}
      onChange={(value) => {
        if (typeof value === "string") {
          onChangeHandle?.(value);
        }
      }}
      placeholder={
        loading ? intl.formatMessage({ id: "table.loading" }) : placeholder
      }
      multiple={false}
      filterable
      {...props}
    />
  );
}
