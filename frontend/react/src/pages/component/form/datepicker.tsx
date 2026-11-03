"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { Controller, useForm } from "react-hook-form"; // 使用 Controller 处理非原生组件
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
// 引入新的 Field 组件系列
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Zod Schema 保持不变
 */
const eventSchema = z.object({
  birthday: z.date({
    error: "Please select a date / 请选择日期",
  }),
  eventTime: z.string().min(1, "Please set a time / 请设置时间"),
  duration: z.object({
    from: z.date(),
    to: z.date(),
  }).refine(data => data.from < data.to, {
    message: "End date must be after start date / 结束日期必须晚于开始日期",
    path: ["to"]
  }),
})

type EventFormValues = z.infer<typeof eventSchema>

export default function GlobalDateForm() {
  const locale = "zh"

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      eventTime: "12:00",
    }
  })

  function onSubmit(data: EventFormValues) {
    console.log("Submit Data:", data)
    toast.success(locale === "zh" ? "提交成功" : "Success")
  }

  return (
    <div className="mx-auto max-w-2xl p-6 border border-border rounded-xl shadow-lg bg-card text-card-foreground">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {locale === "zh" ? "活动计划表单 (Base UI 版)" : "Event Form (Base UI)"}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 1. Birthday - 使用 Field + Controller */}
        <Field>
          <FieldLabel>Birthday / 出生日期</FieldLabel>
          <Controller
            control={control}
            name="birthday"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full pl-3 text-left font-normal bg-background",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: locale === "zh" ? zhCN : enUS })
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    locale={locale === "zh" ? zhCN : enUS}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <FieldError>{errors.birthday?.message}</FieldError>
        </Field>

        {/* 2. Event Time - 演示 FieldGroup 组合用法 */}
        <Field>
          <FieldLabel>Event Time / 活动具体时间</FieldLabel>
          <FieldGroup>
             <div className="relative w-full group">
                <Input 
                  type="time" 
                  {...register("eventTime")}
                  className="pl-9 [color-scheme:light] dark:[color-scheme:dark]" 
                />
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
             </div>
          </FieldGroup>
          <FieldDescription>
            {locale === "zh" ? "此时间将与上述日期合并处理" : "Will be combined with date"}
          </FieldDescription>
          <FieldError>{errors.eventTime?.message}</FieldError>
        </Field>

        {/* 3. Project Duration - 范围选择 */}
        <Field>
          <FieldLabel>Project Duration / 项目周期</FieldLabel>
          <Controller
            control={control}
            name="duration"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {field.value?.from ? (
                      field.value.to ? (
                        `${format(field.value.from, "LLL dd")} - ${format(field.value.to, "LLL dd, y")}`
                      ) : (
                        format(field.value.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a range / 选择区间</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={field.value}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                    locale={locale === "zh" ? zhCN : enUS}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <FieldError>{errors.duration?.to?.message || errors.duration?.message}</FieldError>
        </Field>

        <Separator className="my-6 opacity-50" />

        <Button type="submit" className="w-full shadow-lg font-semibold">
          Submit / 提交
        </Button>
      </form>
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-[1px] w-full bg-border", className)} />
}