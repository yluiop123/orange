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
  order?: number
  name: string
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

  // 递归排序函数
  function sortByOrder(nodes: PermissionNode[]) {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortByOrder(node.children);
      }
    });
  }

  // 排序根节点
  sortByOrder(roots);
  return roots;
}
export default function PermissionTreeSelect({ onChange: onChangeHandle, placeholder, ...props }: PermissionTreeSelectProps) {
  const intl = useIntl()
  const [data, setData] = useState<PermissionNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    listPermissions(undefined, controller.signal)
      .then((permissions) => setData(buildTree(permissions.map((permission) => ({
        ...permission,
        value: permission.id,
        title: permission.name,
      })))))
      .catch(() => {
        // 错误提示由 axios 拦截器统一处理
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

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
