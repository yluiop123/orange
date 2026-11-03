"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Moon, Sun } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const schema = z.object({
  newsletter: z.boolean(),
  notifications: z.boolean(),
  terms: z.boolean().refine((v) => v === true, "请同意条款 / Please accept terms"),
})

type FormValues = z.infer<typeof schema>

export default function SwitchExample() {
  const [loading, setLoading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      newsletter: true,
      notifications: false,
      terms: false,
    },
  })

  async function onSubmit(data: FormValues) {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success("设置已保存 / Settings saved")
    console.log(data)
    setLoading(false)
  }

  return (
    <div className="space-y-10 p-8 max-w-3xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Switch 开关组件</h1>
        <p className="text-muted-foreground mt-2">用于切换二元状态（开 / 关）的交互控件</p>
      </div>

      {/* Basic */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>接收邮件订阅 / Newsletter</Label>
              <p className="text-sm text-muted-foreground">开启后会收到每周订阅邮件</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>桌面通知 / Desktop Notifications</Label>
              <p className="text-sm text-muted-foreground">接收来自应用的桌面通知</p>
            </div>
            <Switch />
          </div>
        </div>
      </section>

      {/* Controlled */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">受控模式 / Controlled</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <ControlledSwitchDemo />
        </div>
      </section>

      {/* Form integration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单集成 / Form Integration</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Controller
                name="newsletter"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>订阅邮件 / Newsletter</FieldLabel>
                    <Switch checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="notifications"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>桌面通知 / Desktop Notifications</FieldLabel>
                    <Switch checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="terms"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>同意条款 / Accept Terms</FieldLabel>
                    <FieldDescription>请阅读并同意服务条款</FieldDescription>
                    <Switch checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />     
              <FieldContent />

              <Button type="submit" className="w-full" disabled={loading}>{loading ? "保存中..." : "保存设置 / Save Settings"}</Button>
            </form>
        </div>
      </section>
    </div>
  )
}

function ControlledSwitchDemo() {
  const [dark, setDark] = React.useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 text-yellow-500" />
          <div>
            <div className="font-medium">浅色主题 / Light</div>
            <div className="text-sm text-muted-foreground">切换以切换主题</div>
          </div>
        </div>
        <Switch checked={!dark} onCheckedChange={(v) => setDark(!v)} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-slate-600" />
          <div>
            <div className="font-medium">深色主题 / Dark</div>
            <div className="text-sm text-muted-foreground">用于夜间模式</div>
          </div>
        </div>
        <Switch checked={dark} onCheckedChange={(v) => setDark(Boolean(v))} />
      </div>
    </div>
  )
}
