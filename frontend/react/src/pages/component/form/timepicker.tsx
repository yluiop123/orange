"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldLabel
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"

import { TimePicker } from "@/components/ext/time-picker"

const schema = z.object({
  meeting: z.string().min(1, "请选择时间 / Please pick a time"),
  start: z.string().min(1, "请选择开始时间 / Please pick start time"),
  end: z.string().min(1, "请选择结束时间 / Please pick end time"),
})

type FormValues = z.infer<typeof schema>

export default function TimePickerExample() {
  const [meeting, setMeeting] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meeting: "",
      start: "",
      end: "",
    },
  })

  async function onSubmit(data: FormValues) {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success("已保存 / Saved")
    console.log(data)
    setLoading(false)
    form.reset()
  }

  return (
    <div className="space-y-12 p-8 max-w-3xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">TimePicker 时间选择器</h1>
        <p className="text-muted-foreground mt-2">基于原生时间输入的轻量封装，便于表单集成</p>
      </div>

      {/* Basic usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div>
            <Label>选择会议时间 / Meeting Time</Label>
            <TimePicker value={meeting} onChange={setMeeting} />
            <p className="text-sm text-muted-foreground mt-2">当前选择: {meeting || "未选择 / none"}</p>
          </div>
        </div>
      </section>

      {/* Range example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">范围/双端选择 / Range</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>开始时间 / Start</Label>
              <TimePicker defaultValue="09:00" />
            </div>
            <div>
              <Label>结束时间 / End</Label>
              <TimePicker defaultValue="17:00" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">用于上班时间 / Example: office hours</p>
        </div>
      </section>

      {/* Step seconds */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">秒级步进 / Seconds Step</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <Label>带秒的时间 / Time with seconds</Label>
          <TimePicker step={1} />
          <p className="text-sm text-muted-foreground">设置 step=1 可支持秒级选择（浏览器支持）</p>
        </div>
      </section>

      {/* Disabled */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">禁用 / Disabled</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Label>不可用的时间选择器 / Disabled</Label>
          <TimePicker defaultValue="12:00" disabled />
        </div>
      </section>

      {/* Form integration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单集成 / Form Integration</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Controller
                name="meeting"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>会议时间 / Meeting</FieldLabel>
                    <TimePicker value={field.value} onChange={field.onChange} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="start"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>开始 / Start</FieldLabel>
                    <TimePicker value={field.value} onChange={field.onChange} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="end"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>结束 / End</FieldLabel>
                    <TimePicker value={field.value} onChange={field.onChange} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "保存中..." : "保存 / Save"}</Button>
            </form>
        </div>
      </section>
    </div>
  )
}
