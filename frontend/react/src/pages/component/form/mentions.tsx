"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Mentions, type MentionOption } from "@/components/ext/mentions"
import { Button } from "@/components/ui/button"
// 替换为新的 Field 组件库
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

// Mock user data / 模拟用户数据
const mockUsers: MentionOption[] = [
  {
    value: "user1",
    label: "张三 / Zhang San",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
    description: "产品经理 / Product Manager",
  },
  {
    value: "user2",
    label: "李四 / Li Si",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
    description: "设计师 / Designer",
  },
  {
    value: "user3",
    label: "王五 / Wang Wu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
    description: "开发者 / Developer",
  },
  {
    value: "user4",
    label: "赵六 / Zhao Liu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user4",
    description: "测试工程师 / QA Engineer",
  },
  {
    value: "user5",
    label: "孙七 / Sun Qi",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user5",
    description: "项目经理 / Project Manager",
  },
]

// Validation schema / 验证规则
const mentionsSchema = z.object({
  comment: z.string()
    .min(1, "评论不能为空 / Comment cannot be empty")
    .max(500, "评论不能超过500字 / Comment cannot exceed 500 characters"),
  feedback: z.string()
    .min(1, "反馈不能为空 / Feedback cannot be empty")
    .max(200, "反馈不能超过200字 / Feedback cannot exceed 200 characters"),
})

type MentionsFormValues = z.infer<typeof mentionsSchema>

export default function MentionsExample() {
  const [basicValue, setBasicValue] = React.useState("")
  const [selectedMention, setSelectedMention] = React.useState<MentionOption | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [mentionedUsers, setMentionedUsers] = React.useState<MentionOption[]>([])

  const form = useForm<MentionsFormValues>({
    resolver: zodResolver(mentionsSchema),
    defaultValues: {
      comment: "",
      feedback: "",
    },
  })

  async function onSubmit(data: MentionsFormValues) {
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
        <h1 className="text-3xl font-bold">Mentions 提及组件</h1>
        <p className="text-muted-foreground mt-2">
          在输入框中输入 @ 来提及其他用户，支持自动完成和搜索
        </p>
      </div>

      {/* 1. 基础用法 Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>输入评论并 @ 提及用户 / Enter comment and mention users</FieldLabel>
            <FieldGroup>
              <Mentions
                value={basicValue}
                onChange={setBasicValue}
                options={mockUsers}
                placeholder="输入 @ 来提及用户... / Type @ to mention users..."
              />
            </FieldGroup>
            <FieldDescription>提示: 输入 @ 符号开始搜索用户</FieldDescription>
          </Field>

          {basicValue && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold mb-1">当前内容 / Current Content:</p>
              <p className="text-sm break-words whitespace-pre-wrap">{basicValue}</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. 不同尺寸 Size Variants */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">不同尺寸 / Size Variants</h2>
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>小号 / Small</FieldLabel>
            <FieldGroup>
              <Mentions size="sm" options={mockUsers} placeholder="小号输入框..." />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel>标准号 / Default</FieldLabel>
            <FieldGroup>
              <Mentions size="default" options={mockUsers} placeholder="标准输入框..." />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel>大号 / Large</FieldLabel>
            <FieldGroup>
              <Mentions size="lg" options={mockUsers} placeholder="大号输入框..." />
            </FieldGroup>
          </Field>
        </div>
      </section>

      {/* 3. 自定义触发符 Custom Trigger */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">自定义触发符 / Custom Trigger</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>使用 # 触发 / Using # trigger</FieldLabel>
            <FieldGroup>
              <Mentions trigger="#" options={mockUsers} placeholder="输入 # 来提及用户..." />
            </FieldGroup>
            <FieldDescription>可以自定义任何字符作为触发符</FieldDescription>
          </Field>

          <Field>
            <FieldLabel>使用 ! 触发 / Using ! trigger</FieldLabel>
            <FieldGroup>
              <Mentions trigger="!" options={mockUsers} placeholder="输入 ! 来提及用户..." />
            </FieldGroup>
          </Field>
        </div>
      </section>

      {/* 4. 受控模式 Controlled Mode */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">受控模式 / Controlled Mode</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>实时监听值变化 / Real-time value tracking</FieldLabel>
            <FieldGroup>
              <Mentions
                value={basicValue}
                onChange={setBasicValue}
                onMention={(option) => {
                  setSelectedMention(option)
                  setMentionedUsers((prev) => [...new Set([...prev, option])])
                }}
                options={mockUsers}
                placeholder="输入 @ 来提及用户..."
              />
            </FieldGroup>
          </Field>

          {selectedMention && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold mb-2">最近提及的用户 / Last mentioned user:</p>
              <div className="flex items-center gap-2">
                <img src={selectedMention.avatar} alt={selectedMention.label} className="h-8 w-8 rounded-full" />
                <div>
                  <p className="text-sm font-semibold">{selectedMention.label}</p>
                  <p className="text-xs text-muted-foreground">{selectedMention.description}</p>
                </div>
              </div>
            </div>
          )}

          {mentionedUsers.length > 0 && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-semibold mb-2">所有提及的用户 / All mentioned users:</p>
              <div className="flex flex-wrap gap-2">
                {mentionedUsers.map((user) => (
                  <div key={user.value} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-sm">
                    <img src={user.avatar} alt={user.label} className="h-5 w-5 rounded-full" />
                    <span>{user.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Loading 状态 Loading State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading 状态 / Loading State</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>模拟加载用户列表 / Simulate loading users</FieldLabel>
            <FieldGroup>
              <Mentions loading={isLoading} options={isLoading ? [] : mockUsers} placeholder="输入 @ 加载用户列表..." />
            </FieldGroup>
          </Field>
          <Button
            onClick={() => {
              setIsLoading(true)
              setTimeout(() => {
                setIsLoading(false)
                toast.success("用户加载完成 / Users loaded successfully")
              }, 2000)
            }}
            disabled={isLoading}
          >
            {isLoading ? "加载中... / Loading..." : "加载用户列表 / Load users"}
          </Button>
        </div>
      </section>

      {/* 6. 禁用状态 Disabled State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">禁用状态 / Disabled State</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <Field >
            <FieldLabel>禁用输入 / Disabled input</FieldLabel>
            <FieldGroup>
              <Mentions disabled={true} options={mockUsers} placeholder="禁用的输入框..." defaultValue="这是一个禁用的输入框" />
            </FieldGroup>
            <FieldDescription>禁用状态下无法输入和提及用户</FieldDescription>
          </Field>
        </div>
      </section>

      {/* 7. 自定义过滤 Custom Filter */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">自定义过滤 / Custom Filter</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>精确匹配 / Exact match</FieldLabel>
            <FieldGroup>
              <Mentions
                options={mockUsers}
                placeholder="输入 @ 进行精确匹配搜索..."
                filterOption={(input, option) => option.label.toLowerCase() === input.toLowerCase()}
              />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel>按角色过滤 / Filter by role</FieldLabel>
            <FieldGroup>
              <Mentions
                options={mockUsers.filter((u) => u.description?.includes("Engineer") || u.description?.includes("工程师"))}
                placeholder="输入 @ 搜索工程师..."
              />
            </FieldGroup>
          </Field>
        </div>
      </section>

      {/* 8. 表单验证示例 Form Validation Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单验证示例 / Form Validation</h2>
        <div className="bg-card p-6 rounded-lg border">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Controller
              control={form.control}
              name="comment"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>评论内容 / Comment</FieldLabel>
                  <FieldGroup>
                    <Mentions
                      {...field}
                      options={mockUsers}
                      placeholder="输入评论，使用 @ 提及用户..."
                    />
                  </FieldGroup>
                  <FieldDescription>评论内容最多 500 字 / Comment up to 500 characters</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="feedback"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>反馈内容 / Feedback</FieldLabel>
                  <FieldGroup>
                    <Mentions
                      {...field}
                      size="sm"
                      options={mockUsers}
                      placeholder="输入反馈... / Enter feedback..."
                    />
                  </FieldGroup>
                  <FieldDescription>反馈内容最多 200 字 / Feedback up to 200 characters</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "提交中... / Submitting..." : "提交表单 / Submit Form"}
            </Button>
          </form>
        </div>
      </section>

      {/* 9. 多行输入场景 Multi-line Input Scenarios */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">多行输入场景 / Multi-line Input Scenarios</h2>
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <Field>
            <FieldLabel>聊天消息 / Chat Message</FieldLabel>
            <FieldGroup>
              <Mentions options={mockUsers} placeholder="输入消息，@ 他人讨论..." />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel>任务分配 / Task Assignment</FieldLabel>
            <FieldGroup>
              <Mentions size="lg" options={mockUsers} placeholder="描述任务并 @ 分配给相关人员..." />
            </FieldGroup>
          </Field>

          <Field>
            <FieldLabel>问题反馈 / Issue Feedback</FieldLabel>
            <FieldGroup>
              <Mentions options={mockUsers} placeholder="描述问题，@ 相关部门..." />
            </FieldGroup>
          </Field>
        </div>
      </section>
    </div>
  )
}