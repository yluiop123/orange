"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// 引入新的 Field 组件系列
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

/**
 * 1. Zod Schema (保持不变)
 */
const profileSchema = z.object({
  username: z.string()
    .min(2, "用户名至少2个字符 / Username must be at least 2 characters")
    .max(20, "名字太长 / Name is too long"),
  email: z.string()
    .email("请输入有效的邮箱 / Please enter a valid email"),
  password: z.string()
    .min(8, "密码至少8位 / Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).superRefine(({ confirmPassword, password }, ctx) => {
  if (confirmPassword !== password) {
    ctx.addIssue({
      code: "custom",
      message: "两次输入的密码不一致 / Passwords do not match",
      path: ["confirmPassword"],
    })
  }
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function DualLanguageForm() {
  const [isLoading, setIsLoading] = React.useState(false)

  // 2. 解构 RHF
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log("Submitted:", data)
    setIsLoading(false)
    toast.success("注册成功 / Registration Successful")
    reset()
  }

  return (
    <div className="max-w-xl mx-auto p-8 border border-border rounded-xl shadow-md bg-card">
      <div className="mb-8 border-b border-border pb-4">
        <h2 className="text-2xl font-bold tracking-tight">创建账户 / Create Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          请填写以下信息完成注册 / Please fill in the details to register
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 用户名 Username */}
        <Field>
          <FieldLabel>用户名 / Username</FieldLabel>
          <FieldGroup>
            <Input placeholder="Nickname..." {...register("username")} />
          </FieldGroup>
          <FieldError>{errors.username?.message}</FieldError>
        </Field>

        {/* 邮箱 Email */}
        <Field>
          <FieldLabel>电子邮箱 / Email Address</FieldLabel>
          <FieldGroup>
            <Input type="email" placeholder="example@domain.com" {...register("email")} />
          </FieldGroup>
          <FieldError>{errors.email?.message}</FieldError>
        </Field>

        {/* 密码组 Password Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field>
            <FieldLabel>密码 / Password</FieldLabel>
            <FieldGroup>
              <Input type="password" {...register("password")} />
            </FieldGroup>
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>确认密码 / Confirm Password</FieldLabel>
            <FieldGroup>
              <Input type="password" {...register("confirmPassword")} />
            </FieldGroup>
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </Field>
        </div>

        <Button type="submit" className="w-full h-12 text-base shadow-lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              提交中 / Submitting...
            </>
          ) : (
            "提交注册 / Submit Registration"
          )}
        </Button>
      </form>
    </div>
  )
}