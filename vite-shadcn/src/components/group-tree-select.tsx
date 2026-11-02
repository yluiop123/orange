import { listGroups } from "@/api/system/group";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import TreeSelect, { TreeNode, TreeSelectProps } from "./ext/tree-select";
type OmittedTreeSelectProps = Omit<TreeSelectProps, 'value' | 'onChange' | 'data'>;

// 2. 重新定义 value 和 onChange 的类型
type GroupTreeSelectProps = OmittedTreeSelectProps & {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};
export type GroupNode = TreeNode & {
  children?: GroupNode[]
  parentId?: string | null
}
function buildTree(data: GroupNode[]): GroupNode[] {
  const map = new Map<string, GroupNode>();
  const roots: GroupNode[] = [];
  // 初始化 map
  for (const item of data) {
    map.set(item?.id || '', { ...item, children: [] });
  }
  // 构建树结构
  for (const item of data) {
    const node = map.get(item?.id || '')!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  // 递归排序函数：同级按编码升序
  function sortByCode(nodes: GroupNode[]) {
    nodes.sort((a, b) => {
      const left = a.id ?? ''
      const right = b.id ?? ''
      return left === right ? 0 : left < right ? -1 : 1
    })
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
export default function GroupTreeSelect({ onChange: onChangeHandle, value, placeholder, ...props }: GroupTreeSelectProps) {
  const intl = useIntl()
  const [data, setData] = useState<GroupNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    listGroups(undefined, controller.signal)
      .then((groups) => setData(buildTree(groups.map((group) => ({
        ...group,
        value: group.id,
        title: group.name,
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
      multiple={false}
      value={value}
      placeholder={loading ? intl.formatMessage({ id: "table.loading" }) : placeholder}
      onChange={(nextValue) => {
        if (typeof nextValue === "string") {
          onChangeHandle?.(nextValue)
        }
      }}
      fieldNames={{
        title: 'name',
        value: 'id',
        children: 'children',
      }}
      {...props}
    />
  )
}
