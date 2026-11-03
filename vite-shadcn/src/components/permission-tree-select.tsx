import { listPermissions } from "@/api/system/permission";
import { buildChildrenTree } from "@/components/system/resource-list/tree";
import type { Status } from "@/lib/status";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import TreeSelect, { TreeNode } from "./ext/tree-select";
import { useReferenceData } from "./ext/use-reference-data";

type PermissionTreeSelectProps = {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export type PermissionNode = TreeNode & {
  parentId?: string | null;
  status?: Status;
  type?: "menu" | "directory" | "action";
};

export default function PermissionTreeSelect({
  onChange: onChangeHandle,
  placeholder,
  ...props
}: PermissionTreeSelectProps) {
  const intl = useIntl();
  const disabledLabel = intl.formatMessage({ id: "dict.status.disabled" });
  const { data, loading } = useReferenceData((signal) =>
    listPermissions(undefined, signal),
  );

  const treeData = useMemo(
    () =>
      buildChildrenTree(
        data.map((permission) => ({
          ...permission,
          value: permission.id,
          title: permission.name,
          disabled: permission.status === "0",
          disabledLabel,
        })),
        { id: (node) => node.value, parentId: (node) => node.parentId },
      ),
    [data, disabledLabel],
  );

  return (
    <TreeSelect
      data={treeData}
      onChange={(value) => {
        if (Array.isArray(value)) {
          onChangeHandle?.(value);
        }
      }}
      placeholder={
        loading ? intl.formatMessage({ id: "table.loading" }) : placeholder
      }
      multiple={true}
      filterable
      {...props}
    />
  );
}
