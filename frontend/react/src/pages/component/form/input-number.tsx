"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { InputNumber } from "@/components/ext/input-number"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

// 验证规则 / Validation Schema
const inputNumberSchema = z.object({
  age: z.number()
    .min(0, "年龄不能为负数")
    .max(150, "年龄不合理"),
  price: z.number()
    .min(0, "价格不能为负数")
    .max(999999, "价格过高"),
  quantity: z.number()
    .min(1, "数量至少为1")
    .max(1000, "数量过多"),
  discount: z.number()
    .min(0, "折扣不能为负数")
    .max(100, "折扣不能超过100%"),
})

type InputNumberFormValues = z.infer<typeof inputNumberSchema>

export default function InputNumberExample() {
  const [basicValue, setBasicValue] = React.useState<number | null>(5)
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InputNumberFormValues>({
    resolver: zodResolver(inputNumberSchema),
    defaultValues: {
      age: 25,
      price: 99.99,
      quantity: 1,
      discount: 10,
    },
  })

  async function onSubmit(data: InputNumberFormValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Form Data:", data)
    toast.success("提交成功 / Submitted Successfully")
    setIsLoading(false)
  }

  return (
    <div className="space-y-12 p-8 max-w-5xl mx-auto">
      {/* Header / 标题 */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">InputNumber 数字输入框</h1>
        <p className="text-muted-foreground mt-2">
          支持 Field 组件原子化布局，集成增减、范围限制与精度控制
        </p>
      </div>

      {/* 1. 基础用法 / Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="grid gap-6 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>默认输入框 / Default</FieldLabel>
            <FieldGroup>
              <InputNumber
                value={basicValue}
                onChange={setBasicValue}
                placeholder="输入数字..."
              />
            </FieldGroup>
            <FieldDescription>当前值: {basicValue}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>带步长 / With Step</FieldLabel>
            <FieldGroup>
              <InputNumber defaultValue={10} step={5} />
            </FieldGroup>
            <FieldDescription>单次增减步长为 5</FieldDescription>
          </Field>
        </div>
      </section>

      {/* 2. 显示操作按钮 / Show Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">显示操作按钮 / Show Buttons</h2>
        <div className="grid gap-6 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>左右完整交互 / Full Controls</FieldLabel>
            <FieldGroup>
              <InputNumber
                defaultValue={5}
                min={0}
                max={10}
                step={2}
                showLeftButtons
                showSpinner
              />
            </FieldGroup>
            <FieldDescription>同时显示左侧 +/- 和右侧微调器</FieldDescription>
          </Field>
        </div>
      </section>

      {/* 3. 小数精度 / Decimal Precision */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">小数精度 / Decimal Precision</h2>
        <div className="grid gap-6 bg-card p-6 rounded-lg border md:grid-cols-2">
          <Field>
            <FieldLabel>整数 / Integer (precision: 0)</FieldLabel>
            <FieldGroup>
              <InputNumber defaultValue={42} precision={0} showSpinner />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel>价格 / Price (precision: 2)</FieldLabel>
            <FieldGroup>
              <InputNumber defaultValue={99.99} precision={2} step={0.01} showSpinner />
            </FieldGroup>
          </Field>
        </div>
      </section>

      {/* 8. 表单验证示例 / Form Validation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单验证示例 / Form Validation</h2>
        <div className="bg-card p-6 rounded-lg border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 年龄 Age */}
              <Controller
                control={control}
                name="age"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>年龄 / Age</FieldLabel>
                    <FieldGroup>
                      <InputNumber
                        {...field}
                        onChange={(val) => field.onChange(val ?? 0)}
                        min={0}
                        max={150}
                        showSpinner
                      />
                    </FieldGroup>
                    <FieldDescription>请输入有效的年龄</FieldDescription>
                    <FieldError>{errors.age?.message}</FieldError>
                  </Field>
                )}
              />

              {/* 价格 Price */}
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>商品价格 / Product Price</FieldLabel>
                    <FieldGroup>
                      <InputNumber
                        {...field}
                        onChange={(val) => field.onChange(val ?? 0)}
                        min={0}
                        precision={2}
                        step={0.01}
                        showSpinner
                      />
                    </FieldGroup>
                    <FieldError>{errors.price?.message}</FieldError>
                  </Field>
                )}
              />

              {/* 数量 Quantity */}
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>购买数量 / Quantity</FieldLabel>
                    <FieldGroup>
                      <InputNumber
                        {...field}
                        onChange={(val) => field.onChange(val ?? 1)}
                        min={1}
                        showLeftButtons
                        showSpinner
                      />
                    </FieldGroup>
                    <FieldError>{errors.quantity?.message}</FieldError>
                  </Field>
                )}
              />

              {/* 折扣 Discount */}
              <Controller
                control={control}
                name="discount"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>折扣百分比 / Discount</FieldLabel>
                    <FieldGroup>
                      <InputNumber
                        {...field}
                        onChange={(val) => field.onChange(val ?? 0)}
                        min={0}
                        max={100}
                        showSpinner
                      />
                    </FieldGroup>
                    <FieldError>{errors.discount?.message}</FieldError>
                  </Field>
                )}
              />
            </div>

            {/* 实时计算结果 */}
            <div className="p-4 bg-muted rounded-lg border border-dashed border-muted-foreground/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">实时预算:</span>
                <span className="font-mono font-bold text-primary">
                  ¥ {(watch("price") * watch("quantity") * (1 - watch("discount") / 100)).toFixed(2)}
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "提交中..." : "提交表单 / Submit Form"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}