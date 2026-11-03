"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"

import TreeSelect, { TreeNode } from "@/components/ext/tree-select"


const treeData: TreeNode[] = [
  {
    value: "asia",
    title: "Asia / 亚洲",
    children: [
      { value: "cn", title: "China / 中国" },
      { value: "jp", title: "Japan / 日本" },
      { value: "in", title: "India / 印度" },
    ],
  },
  {
    value: "europe",
    title: "Europe / 欧洲",
    children: [
      { value: "de", title: "Germany / 德国" },
      { value: "fr", title: "France / 法国" },
      {
        value: "uk",
        title: "UK / 英国",
        children: [
          { value: "eng", title: "England / 英格兰" },
          { value: "sct", title: "Scotland / 苏格兰" },
        ],
      },
    ],
  },
  {
    value: "americas",
    title: "Americas / 美洲",
    children: [
      { value: "us", title: "United States / 美国" },
      { value: "ca", title: "Canada / 加拿大" },
    ],
  },
]

const schema = z.object({
  countries: z.array(z.string()).min(1, "请选择至少一项 / Please select at least one"),
  region: z.string().min(1, "请选择一个地区 / Select a region"),
})

type FormValues = z.infer<typeof schema>

export default function TreeSelectExample() {
  const [controlledValue, setControlledValue] = React.useState<string[]>(["cn", "de"])
  const [maxTagCount, setMaxTagCount] = React.useState(3)
  const [loadingRemote, setLoadingRemote] = React.useState(false)
  const [remoteError, setRemoteError] = React.useState<string | null>(null)
  const [selectedInfo, setSelectedInfo] = React.useState<{value: string, title: string, path: string}[]>([])
  const [formSelectedInfo, setFormSelectedInfo] = React.useState<{value: string, title: string, path: string}[]>([])
  const [regionInfo, setRegionInfo] = React.useState<{value: string, title: string, path: string} | null>(null)
  
  // 基础用法选中信息
  const [basicSelectedInfo, setBasicSelectedInfo] = React.useState<{value: string, title: string, path: string}[]>([])
  
  // 单选模式选中信息
  const [singleSelectedInfo, setSingleSelectedInfo] = React.useState<{value: string, title: string, path: string} | null>(null)
  
  // 搜索选中信息
  const [searchSelectedInfo, setSearchSelectedInfo] = React.useState<{value: string, title: string, path: string}[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countries: controlledValue, region: "asia" },
  })

  React.useEffect(() => {
    // 更新选中信息
    const info: {value: string, title: string, path: string}[] = []
    const findPath = (nodes: TreeNode[], targetValue: string, currentPath: string[] = []): string[] | null => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.title]
        if (node.value === targetValue) {
          return newPath
        }
        if (node.children) {
          const result = findPath(node.children, targetValue, newPath)
          if (result) return result
        }
      }
      return null
    }
    
    controlledValue.forEach(value => {
      const path = findPath(treeData, value)
      if (path) {
        const title = path[path.length - 1]
        info.push({ value, title, path: path.join(' > ') })
      }
    })
    
    setSelectedInfo(info)
  }, [controlledValue, form])
  
  // 监听表单选中值变化
  React.useEffect(() => {
    const watchSubscription = form.watch((value, { name }) => {
      if (name === 'countries' && value.countries) {
        const info: {value: string, title: string, path: string}[] = []
        const findPath = (nodes: TreeNode[], targetValue: string, currentPath: string[] = []): string[] | null => {
          for (const node of nodes) {
            const newPath = [...currentPath, node.title]
            if (node.value === targetValue) {
              return newPath
            }
            if (node.children) {
              const result = findPath(node.children, targetValue, newPath)
              if (result) return result
            }
          }
          return null
        }
        
        value.countries.forEach((v: string | undefined) => {
          if (!v) return
          const path = findPath(treeData, v)
          if (path) {
            const title = path[path.length - 1]
            info.push({ value: v, title, path: path.join(' > ') })
          }
        })
        
        setFormSelectedInfo(info)
      } else if (name === 'region' && value.region) {
        const findPath = (nodes: TreeNode[], targetValue: string, currentPath: string[] = []): string[] | null => {
          for (const node of nodes) {
            const newPath = [...currentPath, node.title]
            if (node.value === targetValue) {
              return newPath
            }
            if (node.children) {
              const result = findPath(node.children, targetValue, newPath)
              if (result) return result
            }
          }
          return null
        }
        
        const path = findPath(treeData, value.region)
        if (path) {
          const title = path[path.length - 1]
          setRegionInfo({ value: value.region, title, path: path.join(' > ') })
        }
      }
    })
    
    return () => watchSubscription.unsubscribe()
  }, [form])

  // 模拟异步加载树数据
  const [remoteData, setRemoteData] = React.useState<TreeNode[] | null>(null)
  const loadRemote = async (fail = false) => {
    setLoadingRemote(true)
    setRemoteError(null)
    setRemoteData(null)
    try {
      await new Promise((r) => setTimeout(r, 900))
      if (fail) throw new Error("Failed to fetch")
      setRemoteData(treeData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "加载失败 / Failed to load"
      setRemoteError(errorMessage)
    } finally {
      setLoadingRemote(false)
    }
  }

  // 工具函数：根据值查找路径信息
  const findPathInfo = (nodes: TreeNode[], targetValues: string[] | string): {value: string, title: string, path: string}[] => {
    const values = Array.isArray(targetValues) ? targetValues : [targetValues].filter(Boolean)
    const info: {value: string, title: string, path: string}[] = []
    
    const findPath = (nodes: TreeNode[], targetValue: string, currentPath: string[] = []): string[] | null => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.title]
        if (node.value === targetValue) {
          return newPath
        }
        if (node.children) {
          const result = findPath(node.children, targetValue, newPath)
          if (result) return result
        }
      }
      return null
    }
    
    values.forEach(value => {
      if (!value) return
      const path = findPath(nodes, value)
      if (path) {
        const title = path[path.length - 1]
        info.push({ value, title, path: path.join(' > ') })
      }
    })
    
    return info
  }
  
  React.useEffect(() => {
    loadRemote()
  }, [])

  async function onSubmit(data: FormValues) {
    await new Promise((r) => setTimeout(r, 600))
    toast.success("已保存 / Saved")
    console.log(data)
  }

  return (
    <div className="space-y-10 p-8 max-w-6xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">TreeSelect / 树形选择</h1>
        <p className="text-muted-foreground mt-2">
          覆盖：基础用法、单选/多选、受控、搜索、异步加载、错误状态、表单集成等常见场景。
        </p>
      </div>

      {/* 1. 基础用法 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Label className="mb-3 block">默认多选 / Default Multiple</Label>
          <TreeSelect
            data={treeData}
            placeholder="请选择国家 / Choose country"
            onChange={(values) => {
              const info = findPathInfo(treeData, values)
              setBasicSelectedInfo(info)
            }}
          />
          {basicSelectedInfo.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">选中信息 / Selected Info:</h4>
              {basicSelectedInfo.map((item, index) => (
                <div key={item.value} className="text-xs mb-2 last:mb-0">
                  <span className="font-medium">{index + 1}. {item.title}</span>
                  <span className="text-muted-foreground ml-2">({item.value})</span>
                  <div className="text-muted-foreground mt-1 ml-4">路径: {item.path}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. 单选模式 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">单选模式 / Single Select</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Label className="mb-3 block">单选一个地区 / Select Single Region</Label>
          <TreeSelect
            data={treeData}
            multiple={false}
            placeholder="请选择地区 / Select region"
            onChange={(value) => {
              const info = findPathInfo(treeData, value)
              setSingleSelectedInfo(info.length > 0 ? info[0] : null)
            }}
          />
          {singleSelectedInfo && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">选中信息 / Selected Info:</h4>
              <div className="text-xs">
                <span className="font-medium">{singleSelectedInfo.title}</span>
                <span className="text-muted-foreground ml-2">({singleSelectedInfo.value})</span>
                <div className="text-muted-foreground mt-1 ml-4">路径: {singleSelectedInfo.path}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. 受控模式 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">受控模式 / Controlled</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="space-y-3">
            <Label>受控多选 / Controlled Multiple</Label>
            <TreeSelect
              data={treeData}
              value={controlledValue}
              onChange={(v) => setControlledValue(Array.isArray(v) ? v : [v])}
              maxTagCount={maxTagCount}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t">
            <Button
              size="sm"
              onClick={() =>
                setControlledValue(
                  treeData.flatMap((n) => (n.children ?? []).map((c: TreeNode) => c.value))
                )
              }
            >
              全选示例 / Select All
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setControlledValue([])
              }}>
              清空 / Clear
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <span>最大标签数 / maxTagCount:</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={maxTagCount}
                onChange={(e) => setMaxTagCount(Number(e.target.value))}
                className="h-8 w-16"
              />
            </label>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              当前选中值: <code className="bg-muted px-2 py-1 rounded text-xs">{JSON.stringify(controlledValue)}</code>
            </p>
            
            {selectedInfo.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">选中信息 / Selected Info:</h4>
                <div className="bg-muted/50 p-3 rounded-md">
                  {selectedInfo.map((item, index) => (
                    <div key={item.value} className="text-xs mb-2 last:mb-0">
                      <span className="font-medium">{index + 1}. {item.title}</span>
                      <span className="text-muted-foreground ml-2">({item.value})</span>
                      <div className="text-muted-foreground mt-1 ml-4">路径: {item.path}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. 搜索与过滤 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">搜索功能 / Search</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Label className="mb-3 block">支持搜索过滤 / Search Enabled</Label>
          <TreeSelect
            data={treeData}
            placeholder="输入搜索 / Type to search..."
            onChange={(values) => {
              const info = findPathInfo(treeData, values)
              setSearchSelectedInfo(info)
            }}
          />
          {searchSelectedInfo.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">选中信息 / Selected Info:</h4>
              {searchSelectedInfo.map((item, index) => (
                <div key={item.value} className="text-xs mb-2 last:mb-0">
                  <span className="font-medium">{index + 1}. {item.title}</span>
                  <span className="text-muted-foreground ml-2">({item.value})</span>
                  <div className="text-muted-foreground mt-1 ml-4">路径: {item.path}</div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            输入任意关键字（如 "China" 或 "中国"）可快速查找 / Type any keyword (e.g., "China" or "中国") to search quickly
          </p>
        </div>
      </section>

      {/* 5. 异步加载 & 错误状态 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">异步加载 / Async Load & Error</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Button size="sm" onClick={() => loadRemote(false)}>
              重新加载 / Reload
            </Button>
            <Button size="sm" variant="outline" onClick={() => loadRemote(true)}>
              模拟失败 / Simulate Error
            </Button>
          </div>

          {loadingRemote && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin h-4 w-4" />
              加载中 / Loading...
            </div>
          )}
          {remoteError && <div className="text-destructive text-sm">错误: {remoteError}</div>}
          {remoteData && (
            <TreeSelect
              data={remoteData}
              placeholder="远程数据 / Remote data"
            />
          )}
        </div>
      </section>

      {/* 6. 表单集成 & 验证 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单集成 / Form Integration</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FieldGroup>
                <Controller
                  name="countries"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="countries-title">
                        已选国家 / Selected Countries
                      </FieldLabel>
                      <TreeSelect
                        data={treeData}
                        value={field.value}
                        onChange={field.onChange}
                        maxTagCount={4}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      <FieldDescription>
                      {formSelectedInfo.length > 0 && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <h4 className="text-sm font-medium mb-2">选中信息 / Selected Info:</h4>
                        {formSelectedInfo.map((item, index) => (
                          <div key={item.value} className="text-xs mb-2 last:mb-0">
                            <span className="font-medium">{index + 1}. {item.title}</span>
                            <span className="text-muted-foreground ml-2">({item.value})</span>
                            <div className="text-muted-foreground mt-1 ml-4">路径: {item.path}</div>
                          </div>
                        ))}
                      </div>
                    )}
                      </FieldDescription>
                    </Field>
                  )}
                />
                <Controller
                  name="region"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="region-title">
                        选择区域 / Choose Region
                      </FieldLabel>
                      <TreeSelect
                        data={treeData}
                        multiple={false}
                        value={field.value}
                        onChange={field.onChange}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                      <FieldDescription>
                        {regionInfo && regionInfo.value === field.value && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md">
                            <h4 className="text-sm font-medium mb-2">选中信息 / Selected Info:</h4>
                            <div className="text-xs">
                              <span className="font-medium">{regionInfo.title}</span>
                              <span className="text-muted-foreground ml-2">({regionInfo.value})</span>
                              <div className="text-muted-foreground mt-1 ml-4">路径: {regionInfo.path}</div>
                            </div>
                          </div>
                        )}
                      </FieldDescription>
                    </Field>
                  )}
                />
              </FieldGroup>
              <Button type="submit" className="w-full">
                提交 / Submit
              </Button>
            </form>
        </div>
      </section>

      {/* 7. 预归一化节点 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">预归一化节点 / Normalized Nodes</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Label className="mb-3 block">
            选择器只接收 value / title / children
          </Label>
          <TreeSelect
            data={[
              {
                value: "custom-a",
                title: "Custom Item A / 自定义项 A",
                children: [
                  { value: "custom-a-1", title: "Sub Item 1 / 子项 1" },
                  { value: "custom-a-2", title: "Sub Item 2 / 子项 2" },
                ],
              },
            ]}
            placeholder="归一化节点 / Normalized nodes"
          />
          <p className="text-xs text-muted-foreground mt-3">
            数据源负责映射字段；TreeSelect 不再二次转换
          </p>
        </div>
      </section>

      {/* 8. 禁用状态 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">禁用状态 / Disabled State</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Label className="mb-3 block">禁用的选择器 / Disabled Selector</Label>
          <div className="opacity-50 pointer-events-none">
            <TreeSelect
              data={treeData}
              placeholder="此选择器已禁用 / This selector is disabled"
            />
          </div>
        </div>
      </section>
    </div>
  )
}