import { listGroups } from "@/api/system/group";
import { buildChildrenTree } from "@/components/system/resource-list/tree";
import type { Status } from "@/lib/status";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import TreeSelect, { TreeNode, TreeSelectProps } from "./ext/tree-select";
import { useReferenceData } from "./ext/use-reference-data";

type OmittedTreeSelectProps = Omit<TreeSelectProps, "value" | "onChange" | "data">;

type GroupTreeSelectProps = OmittedTreeSelectProps & {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export type GroupNode = TreeNode & {
  parentId?: string | null;
  status?: Status;
};

export default function GroupTreeSelect({
  onChange: onChangeHandle,
  value,
  placeholder,
  ...props
}: GroupTreeSelectProps) {
  const intl = useIntl();
  const disabledLabel = intl.formatMessage({ id: "dict.status.disabled" });
  const { data, loading } = useReferenceData((signal) =>
    listGroups(undefined, signal),
  );

  const treeData = useMemo(
    () =>
      buildChildrenTree(
        data.map((group) => ({
          ...group,
          value: group.id,
          title: group.name,
          disabled: group.status === "0",
          disabledLabel,
        })),
        { id: (node) => node.value, parentId: (node) => node.parentId },
      ),
    [data, disabledLabel],
  );

  return (
    <TreeSelect
      data={treeData}
      multiple={false}
      value={value}
      placeholder={
        loading ? intl.formatMessage({ id: "table.loading" }) : placeholder
      }
      onChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onChangeHandle?.(nextValue);
        }
      }}
      {...props}
    />
  );
}
