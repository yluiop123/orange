// src/pages/component/display/segmented/page.tsx
"use client"

import { Segmented, SegmentedOption } from "@/components/ext/segmented"
import { Button } from "@/components/ui/button"
import * as React from "react"

export default function SegmentedDemo() {
  const basicOptions: SegmentedOption[] = [
    { value: "day", label: "Day/日" },
    { value: "week", label: "Week/周" },
    { value: "month", label: "Month/月" },
  ]

  const bilingualOptions: SegmentedOption[] = [
    { value: "name", label: "UserName/用户名" },
    { value: "email", label: "Email/邮箱" },
    { value: "phone", label: "Phone/电话" },
  ]

  const [controlled, setControlled] = React.useState<string | null>("week")
  const [loadingSel, setLoadingSel] = React.useState<string | null>("day")
  const [showLoading, setShowLoading] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let t: any
    if (showLoading) {
      t = setTimeout(() => setShowLoading(false), 1500)
    }
    return () => clearTimeout(t)
  }, [showLoading])

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Segmented 基础用法</h2>
      <div>
        <Segmented options={basicOptions} defaultValue="week" />
      </div>

      <h2 className="text-xl font-bold">Controlled Segmented 受控模式</h2>
      <div className="flex items-center gap-4">
        <Segmented
          options={basicOptions}
          value={controlled}
          onChange={(v) => setControlled(v)}
        />
        <div className="text-sm text-muted-foreground">Current: {controlled}</div>
      </div>

      <h2 className="text-xl font-bold">Loading State（选中项带 Loading）加载态</h2>
      <div className="flex items-center gap-4">
        <Segmented
          options={basicOptions}
          value={loadingSel}
          onChange={(v) => {
            setLoadingSel(v ?? null)
            setShowLoading(true)
          }}
          loading={showLoading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoadingSel("month")
            setShowLoading(true)
          }}
        >
          Set Month（触发加载）
        </Button>
      </div>

      <h2 className="text-xl font-bold">Error & Disabled 状态（错误和禁用）</h2>
      <div className="space-y-3">
        <div>
          <div className="mb-2">Normal with bilingual labels（双语标签示例）</div>
          <Segmented options={bilingualOptions} defaultValue="name" />
        </div>

        <div>
          <div className="mb-2">Disabled（禁用）</div>
          <Segmented options={basicOptions} defaultValue="day" disabled />
        </div>

        <div>
          <div className="mb-2">Error style（错误样式示例）</div>
          <div className="max-w-md">
            <Segmented options={basicOptions} defaultValue="day" error />
            <div className="mt-2 text-sm text-destructive">Selection required 需要选择</div>
          </div>
        </div>
      </div>
    </div>
  )
}