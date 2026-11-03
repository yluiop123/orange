"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"

import Transfer, { TransferItem } from "@/components/ext/transfer"

const mockData: TransferItem[] = Array.from({ length: 12 }).map((_, i) => ({
  key: String(i + 1),
  title: `Item ${i + 1}`,
  description: `描述 / Description ${i + 1}`,
  disabled: i % 7 === 0,
}))

const schema = z.object({
  selected: z.array(z.string()).nonempty("请至少选择一项 / Please select at least one item"),
})

type FormValues = z.infer<typeof schema>

export default function TransferExample() {
  const [target, setTarget] = React.useState<string[]>(["2", "5"])
  const [loading, setLoading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { selected: target },
  })

  React.useEffect(() => {
    if (target.length > 0) {
      form.setValue("selected", target as [string, ...string[]])
    }
  }, [target, form])

  async function onSubmit(data: FormValues) {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success("保存成功 / Saved")
    console.log("Selected:", data.selected)
    setLoading(false)
  }

  return (
    <div className="space-y-12 p-8 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Transfer 穿梭框组件</h1>
        <p className="text-muted-foreground mt-2">在两个面板间移动条目以进行选择</p>
      </div>

      {/* Basic */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Transfer dataSource={mockData} targetKeys={target} onChange={setTarget} />
        </div>
      </section>

      {/* Search + Disabled */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">带搜索与禁用项 / Search & Disabled</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Transfer dataSource={mockData} targetKeys={target} onChange={setTarget} showSearch />
        </div>
      </section>

      {/* Form integration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单集成 / Form Integration</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FieldGroup>
                <Controller
                  name="selected"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="selected-label">
                        已选项 / Selected Items
                      </FieldLabel>
                      <Transfer dataSource={mockData} targetKeys={field.value} onChange={(keys) => { field.onChange(keys); setTarget(keys); }} showSearch />
                      <FieldDescription>
                        将条目从左侧移动到右侧以选择
                      </FieldDescription>
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button type="submit" className="w-full" disabled={loading}>{loading ? "保存中..." : "保存 / Save"}</Button>
            </form>
        </div>
      </section>
    </div>
  )
}
