import { listPermissions } from "@/api/system/permission";
import type { Status } from "@/lib/status";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import TreeSelect, { TreeNode } from "./ext/tree-select";
type PermissionTreeSelectProps = {
  value: string
  onChange: (ids: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  excludeId?: string
}
export type PermissionNode = TreeNode & {
  children?: PermissionNode[]
  parentId?: string | null
  id: string
  name: string
  status?: Status
  type?: "menu" | "directory" | "action"
}
function buildTree(data: PermissionNode[]): PermissionNode[] {
  const map = new Map<string, PermissionNode>();
  const roots: PermissionNode[] = [];

  // 初始化 map
  for (const item of data) {
    map.set(item.id, { ...item, children: [] });
  }

  // 构建树结构
  for (const item of data) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  // 递归排序函数：同级按编码升序
  function sortByCode(nodes: PermissionNode[]) {
    nodes.sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? -1 : 1))
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortByCode(node.children)
      }
    })
  }

  // 排序根节点
  sortByCode(roots)
  return roots;
}
export default function PermissionTreeSelect({ onChange: onChangeHandle, placeholder, excludeId, ...props }: PermissionTreeSelectProps) {
  const intl = useIntl()
  const [data, setData] = useState<PermissionNode[]>([])
  const [loading, setLoading] = useState(true)

  const disabledLabel = intl.formatMessage({ id: "dict.status.disabled" })
  const actionLabel = intl.formatMessage({ id: "dict.permissionType.action" })

  useEffect(() => {
    const controller = new AbortController()
    listPermissions(undefined, controller.signal)
      .then((permissions) => {
        const excluded = new Set<string>();
        if (excludeId) {
          excluded.add(excludeId);
          let changed = true;
          while (changed) {
            changed = false;
            for (const permission of permissions) {
              if (permission.parentId && excluded.has(permission.parentId) && !excluded.has(permission.id)) {
                excluded.add(permission.id);
                changed = true;
              }
            }
          }
        }
        setData(buildTree(permissions
          .filter((permission) => !excluded.has(permission.id))
          .map((permission) => {
            const isDisabled = permission.status === "0"
            const isAction = permission.type === "action"
            return {
              ...permission,
              value: permission.id,
              title: permission.name,
              disabled: isDisabled || isAction,
              disabledLabel: isDisabled ? disabledLabel : isAction ? actionLabel : undefined,
            }
          })))
      })
      .catch(() => {
        // 错误提示由 axios 拦截器统一处理
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [actionLabel, disabledLabel, excludeId])

  return (
    <TreeSelect
      data={data}
      onChange={(value) => {
        if (typeof value === 'string') {
          onChangeHandle?.(value)
        }
      }}
      placeholder={loading ? intl.formatMessage({ id: "table.loading" }) : placeholder}
      fieldNames={{ value: "id", title: "name", children: "children" }}
      multiple={false}
      {...props}
      filterable
    />
  )
}
