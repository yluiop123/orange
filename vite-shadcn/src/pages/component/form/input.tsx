"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroupButton } from "@/components/ui/input-group"
// New Imports
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"

const inputSchema = z.object({
  username: z.string()
    .min(2, "用户名至少2个字符 / Username must be at least 2 characters")
    .max(20, "用户名最多20个字符 / Username must be at most 20 characters"),
  email: z.string()
    .email("请输入有效的邮箱 / Please enter a valid email"),
  password: z.string()
    .min(8, "密码至少8位 / Password must be at least 8 characters"),
  phone: z.string()
    .regex(/^[\d\s\-+()]+$/, "请输入有效的电话号码 / Please enter a valid phone number"),
})

type InputFormValues = z.infer<typeof inputSchema>

export default function InputExample() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InputFormValues>({
    resolver: zodResolver(inputSchema),
    defaultValues: { username: "", email: "", password: "", phone: "" },
  })

  async function onSubmit(data: InputFormValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Form Data:", data)
    toast.success("提交成功 / Submitted Successfully")
    setIsLoading(false)
    reset()
  }

  return (
    <div className="space-y-12 p-8 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Input 输入框组件 (Field Version)</h1>
        <p className="text-muted-foreground mt-2">
          使用 Field, FieldGroup 等组合组件构建的表单结构
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单验证示例 / Form Validation</h2>
        <div className="bg-card p-6 rounded-lg border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Username with Icon inside FieldGroup */}
            <Field>
              <FieldLabel><User className="text-muted-foreground h-4 w-4 ml-3" />用户名 / Username</FieldLabel>
              <FieldGroup>        
                <Input 
                  {...register("username")} 
                  placeholder="2-20 个字符" 
                  className="focus-visible:ring-0 shadow-none" 
                />
              </FieldGroup>
              {errors.username && <FieldError>{errors.username.message}</FieldError>}
            </Field>

            {/* 2. Email */}
            <Field>
              <FieldLabel><Mail className="text-muted-foreground h-4 w-4 ml-3" />邮箱地址 / Email Address</FieldLabel>
              <FieldGroup>               
                <Input 
                  {...register("email")} 
                  type="email" 
                  placeholder="example@email.com" 
                  className="focus-visible:ring-0 shadow-none"
                />
              </FieldGroup>
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>

            {/* 3. Password with Toggle inside FieldGroup */}
            <Field>
              <FieldLabel><Lock className="text-muted-foreground h-4 w-4 ml-3" />密码 / Password</FieldLabel>
              <FieldGroup>                
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="至少8个字符"
                  className="focus-visible:ring-0 shadow-none"
                />
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  onClick={() => setShowPassword(!showPassword)}
                  className="mr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </InputGroupButton>
              </FieldGroup>
              {errors.password && <FieldError>{errors.password.message}</FieldError>}
            </Field>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "提交中..." : "提交表单"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}