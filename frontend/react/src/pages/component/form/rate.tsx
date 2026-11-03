"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Heart, Smile, ThumbsUp } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Rate } from "@/components/ext/rate"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"

// Validation Schema / 验证规则
const rateSchema = z.object({
  satisfaction: z.number()
    .min(1, "请评分 / Please rate")
    .max(5, "评分不能超过5分 / Rating cannot exceed 5 stars"),
  quality: z.number()
    .min(0, "请评分 / Please rate")
    .max(5, "评分不能超过5分 / Rating cannot exceed 5 stars"),
  service: z.number()
    .min(1, "请评分 / Please rate")
    .max(10, "评分不能超过10分 / Rating cannot exceed 10 stars"),
})

type RateFormValues = z.infer<typeof rateSchema>

export default function RateExample() {
//   const [basicRating, setBasicRating] = React.useState(0)
  const [controlledRating, setControlledRating] = React.useState(3)
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      satisfaction: 0,
      quality: 0,
      service: 0,
    },
  })

  async function onSubmit(data: RateFormValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Form Data:", data)
    toast.success("评分提交成功 / Rating submitted successfully")
    setIsLoading(false)
    form.reset()
  }

  return (
    <div className="space-y-12 p-8 max-w-5xl mx-auto">
      {/* Header / 标题 */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Rate 评分组件</h1>
        <p className="text-muted-foreground mt-2">
          用于展示和收集用户的评分意见，支持完整星星、半星评分
        </p>
      </div>

      {/* 1. 基础用法 Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>默认评分 / Default Rating</Label>
            <Rate defaultValue={3} onChange={(val) => console.log("Rating:", val)} />
            <p className="text-sm text-muted-foreground">
              点击星星进行评分 / Click on stars to rate
            </p>
          </div>

          <div className="space-y-2">
            <Label>初始评分为 4 / Initial rating 4</Label>
            <Rate defaultValue={4} />
          </div>

          <div className="space-y-2">
            <Label>初始评分为 2.5 / Initial rating 2.5</Label>
            <Rate defaultValue={2.5} allowHalf />
          </div>
        </div>
      </section>

      {/* 2. 受控模式 Controlled Mode */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">受控模式 / Controlled Mode</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>实时显示评分 / Real-time rating</Label>
            <Rate
              value={controlledRating}
              onChange={setControlledRating}
              allowClear
            />
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">
              <span className="font-semibold">当前评分: / Current rating: </span>
              <span className="text-primary text-lg font-bold">{controlledRating}</span>
              <span className="text-muted-foreground"> / 5</span>
            </p>
          </div>

          <Button
            onClick={() => setControlledRating(0)}
            variant="outline"
            size="sm"
          >
            清除评分 / Clear Rating
          </Button>
        </div>
      </section>

      {/* 3. 不同星数 Different Star Counts */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">不同星数 / Different Star Counts</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>3 星评分 / 3 star rating</Label>
            <Rate count={3} defaultValue={2} />
          </div>

          <div className="space-y-2">
            <Label>5 星评分 / 5 star rating</Label>
            <Rate count={5} defaultValue={4} />
          </div>

          <div className="space-y-2">
            <Label>10 星评分 / 10 star rating</Label>
            <Rate count={10} defaultValue={7} />
          </div>
        </div>
      </section>

      {/* 4. 不同尺寸 Size Variants */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">不同尺寸 / Size Variants</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>小号 / Small</Label>
            <Rate size="sm" defaultValue={3} />
          </div>

          <div className="space-y-2">
            <Label>标准号 / Medium</Label>
            <Rate size="md" defaultValue={3} />
          </div>

          <div className="space-y-2">
            <Label>大号 / Large</Label>
            <Rate size="lg" defaultValue={3} />
          </div>
        </div>
      </section>

      {/* 5. 不同颜色 Different Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">不同颜色 / Different Colors</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>金黄色 / Gold</Label>
            <Rate defaultValue={4} color="text-yellow-400" />
          </div>

          <div className="space-y-2">
            <Label>红色 / Red</Label>
            <Rate defaultValue={4} color="text-red-500" />
          </div>

          <div className="space-y-2">
            <Label>绿色 / Green</Label>
            <Rate defaultValue={4} color="text-green-500" />
          </div>

          <div className="space-y-2">
            <Label>蓝色 / Blue</Label>
            <Rate defaultValue={4} color="text-blue-500" />
          </div>
        </div>
      </section>

      {/* 6. 半星支持 Allow Half */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">半星支持 / Allow Half Star</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>支持半星评分 / Half star rating</Label>
            <Rate
              allowHalf
              defaultValue={3.5}
              onChange={(val) => console.log("Half Rating:", val)}
            />
            <p className="text-sm text-muted-foreground">
              可以给出更精确的评分，比如 3.5 分
            </p>
          </div>

          <div className="space-y-2">
            <Label>受控模式的半星 / Controlled half star</Label>
            <Rate
              allowHalf
              value={controlledRating}
              onChange={setControlledRating}
              allowClear
            />
            <p className="text-sm text-primary font-semibold">
              当前评分: {controlledRating} / 5
            </p>
          </div>
        </div>
      </section>

      {/* 7. 禁用状态 Disabled State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">禁用状态 / Disabled State</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>禁用评分 / Disabled rating</Label>
            <Rate disabled defaultValue={4} />
            <p className="text-sm text-muted-foreground">
              禁用状态下无法修改评分
            </p>
          </div>

          <div className="space-y-2">
            <Label>只读显示 / Read-only display</Label>
            <Rate disabled defaultValue={3.5} allowHalf />
          </div>
        </div>
      </section>

      {/* 8. 允许清除 Allow Clear */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">允许清除 / Allow Clear</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>允许清除评分 / Allow clear rating</Label>
            <Rate
              allowClear
              defaultValue={3}
              onChange={(val) => console.log("Rating:", val)}
            />
            <p className="text-sm text-muted-foreground">
              点击已选中的星星可以清除评分 / Click selected star to clear rating
            </p>
          </div>
        </div>
      </section>

      {/* 9. 自定义文字提示 Custom Tooltips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">自定义提示 / Custom Tooltips</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>满意度评分 / Satisfaction rating</Label>
            <Rate
              count={5}
              defaultValue={3}
              tooltips={["非常不满意 / Very Dissatisfied", "不满意 / Dissatisfied", "一般 / Fair", "满意 / Satisfied", "非常满意 / Very Satisfied"]}
            />
          </div>

          <div className="space-y-2">
            <Label>难度评分 / Difficulty rating</Label>
            <Rate
              count={5}
              defaultValue={2}
              tooltips={["非常简单 / Very Easy", "简单 / Easy", "适中 / Medium", "困难 / Hard", "非常困难 / Very Hard"]}
            />
          </div>
        </div>
      </section>

      {/* 10. 自定义图标 Custom Character */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">自定义图标 / Custom Icon</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>爱心图标 / Heart icon</Label>
            <Rate
              defaultValue={3}
              character={<Heart className="h-full w-full fill-current" />}
              color="text-red-500"
            />
          </div>

          <div className="space-y-2">
            <Label>赞同图标 / Thumbs up icon</Label>
            <Rate
              defaultValue={4}
              character={<ThumbsUp className="h-full w-full fill-current" />}
              color="text-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label>笑脸图标 / Smile icon</Label>
            <Rate
              defaultValue={5}
              character={<Smile className="h-full w-full fill-current" />}
              color="text-green-500"
            />
          </div>
        </div>
      </section>

      {/* 11. 表单验证示例 Form Validation Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单验证示例 / Form Validation</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 满意度 Satisfaction */}
              <Controller
                name="satisfaction"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>您对服务的满意度 / Service Satisfaction</FieldLabel>
                    <Rate
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onBlur={() => field.onBlur()}
                      count={5}
                      allowClear
                      tooltips={["非常不满意", "不满意", "一般", "满意", "非常满意"]}
                    />
                    <FieldDescription>
                      请评价您对我们服务的满意度 / Please rate your satisfaction with our service
                    </FieldDescription>
                  </Field>
                )}
              />

              {/* 质量 Quality */}
              <Controller
                name="quality"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>商品质量 / Product Quality</FieldLabel>
                     <Rate
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        onBlur={() => field.onBlur()}
                        count={5}
                        allowHalf
                        allowClear
                        tooltips={["极差", "较差", "一般", "良好", "优秀"]}
                      />
                    <FieldDescription>
                      评价商品的质量 / Rate the quality of the product
                    </FieldDescription>
                  </Field>
                )}
              />              

              {/* 服务 Service */}
              <Controller
                name="service"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>客户服务 / Customer Service (0-10)</FieldLabel>
                     <Rate
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        onBlur={() => field.onBlur()}
                        count={10}
                        allowClear
                        color="text-blue-500"
                      />
                    <FieldDescription>
                      给客户服务评分，0-10 分 / Rate customer service from 0-10
                    </FieldDescription>
                  </Field>
                )}
              />              

              {/* 评分摘要 Rating Summary */}
              {(form.watch("satisfaction") > 0 || form.watch("quality") > 0 || form.watch("service") > 0) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-semibold text-blue-900 mb-2">评分摘要 / Rating Summary</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>满意度: {form.watch("satisfaction")} / 5</p>
                    <p>质量: {form.watch("quality")} / 5</p>
                    <p>服务: {form.watch("service")} / 10</p>
                  </div>
                </div>
              )}

              {/* 提交按钮 Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "提交中... / Submitting..." : "提交评分 / Submit Rating"}
              </Button>
            </form>
        </div>
      </section>

      {/* 12. 实际应用场景 Real-world Scenarios */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">实际应用场景 / Real-world Scenarios</h2>
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="border-b pb-4 last:border-b-0">
            <Label className="block mb-3">电商商品评分 / Product Rating</Label>
            <div className="flex items-center gap-3">
              <Rate defaultValue={4.5} allowHalf size="md" />
              <span className="text-sm text-muted-foreground">4.5 / 5 (128 条评价)</span>
            </div>
          </div>

          <div className="border-b pb-4 last:border-b-0">
            <Label className="block mb-3">应用评价 / App Rating</Label>
            <div className="flex items-center gap-3">
              <Rate defaultValue={5} size="md" color="text-yellow-400" />
              <span className="text-sm text-muted-foreground">完美评价 / Perfect Rating</span>
            </div>
          </div>

          <div className="border-b pb-4 last:border-b-0">
            <Label className="block mb-3">餐厅评分 / Restaurant Rating</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm">环境 / Environment</span>
                <Rate defaultValue={4} count={5} size="sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm">口味 / Taste</span>
                <Rate defaultValue={5} count={5} size="sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm">服务 / Service</span>
                <Rate defaultValue={3.5} count={5} size="sm" allowHalf />
              </div>
            </div>
          </div>

          <div>
            <Label className="block mb-3">用户体验评分 / Experience Rating</Label>
            <Rate defaultValue={4} count={5} size="sm" allowHalf tooltips={["无法使用", "差", "中等", "好", "优秀"]} />
          </div>
        </div>
      </section>
    </div>
  )
}
