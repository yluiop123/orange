"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Thermometer, Volume2, Wind, Zap } from "lucide-react"
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
import { Slider } from "@/components/ui/slider"

// 1. 更加严谨的验证规则
const sliderSchema = z.object({
  volume: z.number().min(0).max(100),
  brightness: z.number().min(0).max(100),
  priceRange: z.array(z.number()).length(2),
  temperature: z.number().min(-10).max(50),
})

type SliderFormValues = z.infer<typeof sliderSchema>

export default function SliderExample() {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<SliderFormValues>({
    resolver: zodResolver(sliderSchema),
    defaultValues: {
      volume: 50,
      brightness: 70,
      priceRange: [20, 80],
      temperature: 20,
    },
  })

  // 监听值变化用于实时预览 (Watch values for live preview)
  const watchedValues = form.watch()

  async function onSubmit(data: SliderFormValues) {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    console.log("Submit Data:", data)
    toast.success("配置已保存")
    setIsLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">控制中心</h1>
        <p className="text-muted-foreground">通过滑块精密调节您的系统参数</p>
      </header>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
          
          {/* 交互反馈区 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 音量与亮度 (单滑块示例) */}
            <div className="space-y-6 p-6 rounded-xl border bg-card">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-yellow-500" /> 基础调节
              </h3>
              <Controller
                name="volume"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}> 
                      <Volume2 className={field.value > 70 ? "text-destructive" : ""} size={18} />
                        音量 ({field.value}%)</FieldLabel>
                    <Slider
                      className="border-2 border-primary-300"
                      // 确保传入的是数组
                      value={[field.value]} 
                      // 解决方法：先接收原始参数 v，在内部进行断言并解构
                      onValueChange={field.onChange}
                      max={100}
                      step={1}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="brightness"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>亮度调节</FieldLabel>
                    <Slider
                      className="border-2 border-primary-300"
                        value={[field.value]}
                        onValueChange={field.onChange}
                        max={100}
                      />
                      <div 
                      className="h-2 w-full rounded-full transition-all duration-300 bg-primary-300" 
                      style={{ backgroundColor: `rgba(255, 255, 255, ${field.value / 100})`, filter: 'invert(1)' }}
                    />
                  </Field>
                )}
              />
            </div>
            {/* 范围与高级设置 (多滑块示例) */}
            <div className="space-y-6 p-6 rounded-xl border bg-card">
              <h3 className="font-medium flex items-center gap-2 mb-4">
                <Wind className="h-4 w-4 text-blue-500" /> 环境与预算
              </h3>

              {/* 价格范围 */}
            <Controller
              name="priceRange"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <div className="flex justify-between">
                      <FieldLabel htmlFor={field.name}>预算区间</FieldLabel>
                      <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                        ${field.value[0]} - ${field.value[1]}
                      </span>
                    </div>
                    <Slider
                      className="border-2 border-primary-300"
                      value={field.value}
                      onValueChange={field.onChange} // 数组对数组，无需解构
                      min={0}
                      max={500}
                      step={5}
                    />
                </Field>
              )}
            />
              {/* 温度 */}
            <Controller
              name="temperature"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                      <Thermometer className={field.value > 30 ? "text-orange-500" : "text-blue-400"} size={18} />
                      环境温度 ({field.value}°C)
                  </FieldLabel>
                  <Slider
                    className="border-2 border-primary-300"
                    value={[field.value]}
                    onValueChange={field.onChange}
                    min={-10}
                    max={50}
                    step={1}
                  />
                </Field>
              )}
            />              
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full shadow-lg" disabled={isLoading}>
            {isLoading ? "正在应用配置..." : "保存当前设置"}
          </Button>
        </form>

      {/* 底部摘要预览 */}
      <footer className="bg-muted/50 p-4 rounded-lg border border-dashed text-sm">
        <h4 className="font-semibold mb-2 italic">实时配置快照 (JSON):</h4>
        <pre className="text-[11px] overflow-auto">
          {JSON.stringify(watchedValues, null, 2)}
        </pre>
      </footer>
    </div>
  )
}