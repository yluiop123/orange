import { listPermissions } from "@/api/system/permission";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import TreeSelect, { TreeNode } from "./ext/tree-select";
type PermissionTreeSelectProps = {
  value: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}
export type PermissionNode = TreeNode & {
  children?: PermissionNode[]
  parentId?: string | null
  id: string
  name: string
  status?: "0" | "1"
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
export default function PermissionTreeSelect({ onChange: onChangeHandle, placeholder, ...props }: PermissionTreeSelectProps) {
  const intl = useIntl()
  const [data, setData] = useState<PermissionNode[]>([])
  const [loading, setLoading] = useState(true)

  const disabledLabel = intl.formatMessage({ id: "dict.status.disabled" })

  useEffect(() => {
    const controller = new AbortController()
    listPermissions(undefined, controller.signal)
      .then((permissions) => setData(buildTree(permissions.map((permission) => ({
        ...permission,
        value: permission.id,
        title: permission.name,
        disabled: permission.status === "0",
        disabledLabel,
      })))))
      .catch(() => {
        // 错误提示由 axios 拦截器统一处理
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [disabledLabel])

  return (
    <TreeSelect
      data={data}
      onChange={(value) => {
        if (Array.isArray(value)) {
          onChangeHandle?.(value)
        }
      }}
      placeholder={loading ? intl.formatMessage({ id: "table.loading" }) : placeholder}
      fieldNames={{ value: "id", title: "name", children: "children" }}
      multiple={true}
      {...props}
      filterable
    />
  )
}
