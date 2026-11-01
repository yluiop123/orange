"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Package, Shield, Zap } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Validation Schema / 验证规则
const radioSchema = z.object({
  gender: z.enum(["male", "female", "other"], {
    error: "请选择性别 / Please select gender",
  }),
  plan: z.enum(["basic", "pro", "enterprise"], {
    error: "请选择套餐 / Please select plan",
  }),
  agreement: z.enum(["agree"], {
    error: "必须同意协议 / Must agree to terms",
  }),
  notification: z.enum(["all", "important", "none"], {
    error: "请选择通知方式 / Please select notification",
  }),
})

type RadioFormValues = z.infer<typeof radioSchema>

export default function RadioExample() {
  const [selectedOption, setSelectedOption] = React.useState("option1")
  const [selectedPayment, setSelectedPayment] = React.useState("credit-card")
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<RadioFormValues>({
    resolver: zodResolver(radioSchema),
    defaultValues: {
      gender: "male",
      plan: "basic",
      agreement: "agree",
      notification: "all",
    },
  })

  async function onSubmit(data: RadioFormValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Form Data:", data)
    toast.success("提交成功 / Submitted Successfully")
    setIsLoading(false)
    form.reset()
  }

  return (
    <div className="space-y-12 p-8 max-w-5xl mx-auto">
      {/* Header / 标题 */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Radio 单选框组件</h1>
        <p className="text-muted-foreground mt-2">
          单选框用于在多个互斥的选项中选择一个
        </p>
      </div>

      {/* 1. 基础用法 Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="grid gap-6 bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">请选择一个选项 / Select an option</Label>
            <RadioGroup defaultValue="option1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="option1" />
                <Label htmlFor="option1" className="font-normal cursor-pointer">
                  选项一 / Option One
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="option2" />
                <Label htmlFor="option2" className="font-normal cursor-pointer">
                  选项二 / Option Two
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id="option3" />
                <Label htmlFor="option3" className="font-normal cursor-pointer">
                  选项三 / Option Three
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* 2. 受控模式 Controlled Mode */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">受控模式 / Controlled Mode</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">实时监听选择 / Real-time selection</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="ctrl-option1" />
                <Label htmlFor="ctrl-option1" className="font-normal cursor-pointer">
                  选项一 / Option One
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="ctrl-option2" />
                <Label htmlFor="ctrl-option2" className="font-normal cursor-pointer">
                  选项二 / Option Two
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id="ctrl-option3" />
                <Label htmlFor="ctrl-option3" className="font-normal cursor-pointer">
                  选项三 / Option Three
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              <span className="font-semibold">当前选择: / Current selection: </span>
              <span className="text-primary">{selectedOption}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3. 不同状态 Different States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">不同状态 / Different States</h2>
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">正常状态 / Normal State</Label>
            <RadioGroup defaultValue="normal">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="font-normal cursor-pointer">
                  已选择 / Selected
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unselected" id="unselected" />
                <Label htmlFor="unselected" className="font-normal cursor-pointer">
                  未选择 / Unselected
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">禁用状态 / Disabled State</Label>
            <RadioGroup defaultValue="enabled">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enabled" id="enabled" />
                <Label htmlFor="enabled" className="font-normal cursor-pointer">
                  启用 / Enabled
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disabled" id="disabled" disabled />
                <Label htmlFor="disabled" className="font-normal cursor-pointer opacity-50">
                  禁用 / Disabled
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* 4. 纵向布局 Vertical Layout */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">纵向布局 / Vertical Layout</h2>
        <div className="grid gap-6 bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">性别 / Gender</Label>
            <RadioGroup defaultValue="male" className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="font-normal cursor-pointer">
                  男 / Male
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="font-normal cursor-pointer">
                  女 / Female
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  其他 / Other
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* 5. 横向布局 Horizontal Layout */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">横向布局 / Horizontal Layout</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">支付方式 / Payment Method</Label>
            <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credit-card" id="credit-card" />
                <Label htmlFor="credit-card" className="font-normal cursor-pointer">
                  信用卡 / Credit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alipay" id="alipay" />
                <Label htmlFor="alipay" className="font-normal cursor-pointer">
                  支付宝 / Alipay
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wechat" id="wechat" />
                <Label htmlFor="wechat" className="font-normal cursor-pointer">
                  微信支付 / WeChat Pay
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                <Label htmlFor="bank-transfer" className="font-normal cursor-pointer">
                  银行转账 / Bank Transfer
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm">
              <span className="font-semibold">选择的支付方式: / Selected payment: </span>
              <span className="text-primary">{selectedPayment}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 6. 带描述的选项 Options with Description */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">带描述的选项 / Options with Description</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">选择套餐 / Select Plan</Label>
            <RadioGroup defaultValue="basic" className="space-y-4">
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="basic" id="plan-basic" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="plan-basic" className="font-semibold cursor-pointer">
                    基础套餐 / Basic Plan
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    包含基本功能，适合个人用户
                  </p>
                </div>
                <span className="text-primary font-semibold">¥99/月</span>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="pro" id="plan-pro" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="plan-pro" className="font-semibold cursor-pointer flex items-center gap-2">
                    专业套餐 / Pro Plan
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">推荐 / Recommended</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    更多高级功能，适合团队使用
                  </p>
                </div>
                <span className="text-primary font-semibold">¥299/月</span>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="enterprise" id="plan-enterprise" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="plan-enterprise" className="font-semibold cursor-pointer">
                    企业套餐 / Enterprise Plan
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    完整功能，可自定义，适合大型企业
                  </p>
                </div>
                <span className="text-primary font-semibold">自定义 / Custom</span>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* 7. 带图标的选项 Options with Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">带图标的选项 / Options with Icons</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <Label className="text-base font-semibold">选择功能 / Select Feature</Label>
            <RadioGroup defaultValue="standard" className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="standard" id="feature-standard" />
                <Package className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="feature-standard" className="font-normal cursor-pointer flex-1">
                  标准版本 / Standard Edition
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="fast" id="feature-fast" />
                <Zap className="h-5 w-5 text-yellow-500" />
                <Label htmlFor="feature-fast" className="font-normal cursor-pointer flex-1">
                  快速版本 / Fast Edition
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="secure" id="feature-secure" />
                <Shield className="h-5 w-5 text-green-500" />
                <Label htmlFor="feature-secure" className="font-normal cursor-pointer flex-1">
                  安全版本 / Secure Edition
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </section>

      {/* 8. 表单验证示例 Form Validation Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单验证示例 / Form Validation</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 性别 Gender */}
              <FieldGroup>
                <Controller
                  name="gender"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="gender">
                        性别 / Gender
                      </FieldLabel>
                      <RadioGroup
                        id="gender"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        className="flex flex-col space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="gender-male" />
                          <Label htmlFor="gender-male" className="font-normal cursor-pointer">
                            男 / Male
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="gender-female" />
                          <Label htmlFor="gender-female" className="font-normal cursor-pointer">
                            女 / Female
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="gender-other" />
                          <Label htmlFor="gender-other" className="font-normal cursor-pointer">
                            其他 / Other
                          </Label>
                        </div>
                      </RadioGroup>
                    </Field>
                  )}
                />
                <Controller
                  name="plan"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="plan">
                        选择套餐 / Select Plan
                      </FieldLabel>
                      <RadioGroup
                        id="plan"
                        {...field}
                        aria-invalid={fieldState.invalid}
                        className="flex flex-col space-y-3"
                      >
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value="basic" id="form-plan-basic" />
                          <Label htmlFor="form-plan-basic" className="font-normal cursor-pointer flex-1">
                            基础套餐 / Basic - ¥99/月
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value="pro" id="form-plan-pro" />
                          <Label htmlFor="form-plan-pro" className="font-normal cursor-pointer flex-1">
                            专业套餐 / Pro - ¥299/月
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value="enterprise" id="form-plan-enterprise" />
                          <Label htmlFor="form-plan-enterprise" className="font-normal cursor-pointer flex-1">
                            企业套餐 / Enterprise - 自定义
                          </Label>
                        </div>
                      </RadioGroup>
                    </Field>
                  )}
                />
                <Controller
                  name="agreement"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="agree" id="agreement" className="mt-1" />
                          <Label htmlFor="agreement" className="font-normal cursor-pointer">
                            我已阅读并同意《服务协议》和《隐私政策》 / I have read and agree to the Terms of Service and Privacy Policy
                          </Label>
                        </div>
                      </RadioGroup>
                    </Field>
                  )}
                />
                <Controller
                  name="notification"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="notification">
                        通知方式 / Notification Preference
                      </FieldLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="notify-all" />
                          <Label htmlFor="notify-all" className="font-normal cursor-pointer">
                            接收所有通知 / Receive all notifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="important" id="notify-important" />
                          <Label htmlFor="notify-important" className="font-normal cursor-pointer">
                            仅接收重要通知 / Receive important notifications only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="notify-none" />
                          <Label htmlFor="notify-none" className="font-normal cursor-pointer">
                            不接收通知 / No notifications
                          </Label>
                        </div>
                      </RadioGroup>
                    </Field>
                  )}
                />
              </FieldGroup>
              {/* 提交按钮 Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "提交中... / Submitting..." : "提交表单 / Submit Form"}
              </Button>
            </form>
        </div>
      </section>

      {/* 9. 条件显示 Conditional Display */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">条件显示 / Conditional Display</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">选择订阅类型 / Select subscription type</Label>
              <RadioGroup defaultValue="monthly" className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="sub-monthly" />
                  <Label htmlFor="sub-monthly" className="font-normal cursor-pointer">
                    月度订阅 / Monthly subscription
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="sub-yearly" />
                  <Label htmlFor="sub-yearly" className="font-normal cursor-pointer flex items-center gap-2">
                    年度订阅 / Yearly subscription
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      省 20% / Save 20%
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lifetime" id="sub-lifetime" />
                  <Label htmlFor="sub-lifetime" className="font-normal cursor-pointer flex items-center gap-2">
                    终身订阅 / Lifetime subscription
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      热销 / Popular
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">提示 / Tip</p>
                <p className="text-sm text-blue-800 mt-1">
                  选择年度或终身订阅可享受更多优惠
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
