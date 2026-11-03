"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Briefcase, Globe, Users } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Validation Schema / 验证规则
const selectSchema = z.object({
  country: z.string()
    .min(1, "请选择国家 / Please select a country"),
  language: z.string()
    .min(1, "请选择语言 / Please select a language"),
  department: z.string()
    .min(1, "请选择部门 / Please select a department"),
  experience: z.string()
    .min(1, "请选择经验年限 / Please select experience"),
  category: z.string()
    .min(1, "请选择分类 / Please select a category"),
})

type SelectFormValues = z.infer<typeof selectSchema>

// Mock data
const countries = [
  { value: "cn", label: "中国 / China" },
  { value: "us", label: "美国 / United States" },
  { value: "uk", label: "英国 / United Kingdom" },
  { value: "jp", label: "日本 / Japan" },
  { value: "de", label: "德国 / Germany" },
  { value: "fr", label: "法国 / France" },
]

const languages = [
  { value: "zh", label: "中文 / Chinese" },
  { value: "en", label: "英文 / English" },
  { value: "ja", label: "日文 / Japanese" },
  { value: "de", label: "德文 / German" },
  { value: "fr", label: "法文 / French" },
  { value: "es", label: "西班牙文 / Spanish" },
]

const departments = [
  { value: "frontend", label: "前端 / Frontend" },
  { value: "backend", label: "后端 / Backend" },
  { value: "design", label: "设计 / Design" },
  { value: "product", label: "产品 / Product" },
  { value: "hr", label: "人力资源 / HR" },
]

const experience = [
  { value: "0-1", label: "0-1 年" },
  { value: "1-3", label: "1-3 年" },
  { value: "3-5", label: "3-5 年" },
  { value: "5-10", label: "5-10 年" },
  { value: "10+", label: "10+ 年" },
]

const categories = [
  {
    group: "基础 / Basic",
    items: [
      { value: "text", label: "文本 / Text" },
      { value: "number", label: "数字 / Number" },
      { value: "date", label: "日期 / Date" },
    ],
  },
  {
    group: "高级 / Advanced",
    items: [
      { value: "file", label: "文件 / File" },
      { value: "json", label: "JSON" },
      { value: "api", label: "API" },
    ],
  },
]

export default function SelectExample() {
  const [selectedValue, setSelectedValue] = React.useState<string | null>("")
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<SelectFormValues>({
    resolver: zodResolver(selectSchema),
    defaultValues: {
      country: "",
      language: "",
      department: "",
      experience: "",
      category: "",
    },
  })

  async function onSubmit(data: SelectFormValues) {
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
        <h1 className="text-3xl font-bold">Select 选择器组件</h1>
        <p className="text-muted-foreground mt-2">
          用于从多个预定义选项中选择一个或多个值的下拉选择器
        </p>
      </div>

      {/* 1. 基础用法 Basic Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">基础用法 / Basic Usage</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>选择国家 / Select country</Label>
            <Select defaultValue="cn">
              <SelectTrigger className="w-64">
                <SelectValue placeholder="请选择国家..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>选择语言 / Select language</Label>
            <Select defaultValue="en">
              <SelectTrigger className="w-64">
                <SelectValue placeholder="请选择语言..." />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 2. 受控模式 Controlled Mode */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">受控模式 / Controlled Mode</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>实时显示选择值 / Real-time selection</Label>
            <Select value={selectedValue} onValueChange={setSelectedValue}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="请选择一个选项..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedValue && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-semibold">已选择: / Selected: </span>
                <span className="text-primary">
                  {countries.find((c) => c.value === selectedValue)?.label}
                </span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. 分组选项 Grouped Options */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">分组选项 / Grouped Options</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>选择数据类型 / Select data type</Label>
            <Select defaultValue="text">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectGroup key={category.group}>
                    <SelectLabel>{category.group}</SelectLabel>
                    {category.items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 4. 禁用状态 Disabled State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">禁用状态 / Disabled State</h2>
        <div className="space-y-4 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>禁用的选择器 / Disabled select</Label>
            <Select disabled defaultValue="cn">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              禁用状态下无法选择 / Cannot select in disabled state
            </p>
          </div>

          <div className="space-y-2">
            <Label>禁用的选项 / Disabled options</Label>
            <Select defaultValue="frontend">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.value}
                    value={dept.value}
                    disabled={dept.value === "backend"}
                  >
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              后端选项已禁用 / Backend option is disabled
            </p>
          </div>
        </div>
      </section>

      {/* 5. 带图标的选项 Options with Icons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">带图标的选项 / Options with Icons</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>选择部门 / Select department</Label>
            <Select defaultValue="frontend">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>部门 / Departments</SelectLabel>
                  <SelectItem value="frontend" className="flex items-center gap-2">
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      前端 / Frontend
                    </span>
                  </SelectItem>
                  <SelectItem value="backend">
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      后端 / Backend
                    </span>
                  </SelectItem>
                  <SelectItem value="design">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      设计 / Design
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 6. 不同宽度 Different Widths */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">不同宽度 / Different Widths</h2>
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>小宽度 / Small width</Label>
            <Select defaultValue="cn">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>中等宽度 / Medium width</Label>
            <Select defaultValue="cn">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>大宽度 / Large width</Label>
            <Select defaultValue="cn">
              <SelectTrigger className="w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>全宽 / Full width</Label>
            <Select defaultValue="cn">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 7. 多个选择器并排 Multiple Selects */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">多个选择器 / Multiple Selects</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>国家 / Country</Label>
                <Select defaultValue="cn">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>语言 / Language</Label>
                <Select defaultValue="zh">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>部门 / Department</Label>
                <Select defaultValue="frontend">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>经验 / Experience</Label>
                <Select defaultValue="1-3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experience.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>
                        {exp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. 可搜索的模拟 Searchable (with filtering) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">长列表选项 / Long List Options</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label>选择城市 / Select city</Label>
            <Select defaultValue="bj">
              <SelectTrigger className="w-64">
                <SelectValue placeholder="搜索城市..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>华东 / East China</SelectLabel>
                  <SelectItem value="sh">上海 / Shanghai</SelectItem>
                  <SelectItem value="hz">杭州 / Hangzhou</SelectItem>
                  <SelectItem value="nj">南京 / Nanjing</SelectItem>
                  <SelectItem value="sx">苏州 / Suzhou</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>华北 / North China</SelectLabel>
                  <SelectItem value="bj">北京 / Beijing</SelectItem>
                  <SelectItem value="tj">天津 / Tianjin</SelectItem>
                  <SelectItem value="zy">郑州 / Zhengzhou</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>华南 / South China</SelectLabel>
                  <SelectItem value="gz">广州 / Guangzhou</SelectItem>
                  <SelectItem value="sz">深圳 / Shenzhen</SelectItem>
                  <SelectItem value="fz">福州 / Fuzhou</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              提示: 在下拉列表中可以直接输入搜索 / Tip: Type to search in the dropdown
            </p>
          </div>
        </div>
      </section>

      {/* 9. 表单验证示例 Form Validation Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">表单验证示例 / Form Validation</h2>
        <div className="bg-card p-6 rounded-lg border">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FieldGroup>  
                <Controller
                  name="country"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="country">
                        国家 / Country
                      </FieldLabel>
                      <Select {...field}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择国家..." />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="language"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="language">
                        语言 / Language
                      </FieldLabel>
                      <Select {...field}>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择语言..." />
                          </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="department"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="department">
                        部门 / Department
                      </FieldLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择部门..." />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="experience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="experience">
                        经验年限 / Experience
                      </FieldLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择经验年限..." />
                        </SelectTrigger>
                        <SelectContent>
                          {experience.map((exp) => (
                            <SelectItem key={exp.value} value={exp.value}>
                              {exp.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
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

      {/* 10. 实际应用场景 Real-world Scenarios */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">实际应用场景 / Real-world Scenarios</h2>
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <Label className="block font-semibold">用户信息表单 / User Information Form</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">国家 / Country</Label>
                  <Select defaultValue="cn">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">城市 / City</Label>
                  <Select defaultValue="bj">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bj">北京 / Beijing</SelectItem>
                      <SelectItem value="sh">上海 / Shanghai</SelectItem>
                      <SelectItem value="gz">广州 / Guangzhou</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block font-semibold">求职信息 / Job Application</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">期望部门 / Desired Department</Label>
                  <Select defaultValue="frontend">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">工作经验 / Experience</Label>
                  <Select defaultValue="3-5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {experience.map((exp) => (
                        <SelectItem key={exp.value} value={exp.value}>
                          {exp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block font-semibold">数据导入 / Data Import</Label>
            <div className="space-y-3">
              <Select defaultValue="json">
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectGroup key={category.group}>
                      <SelectLabel>{category.group}</SelectLabel>
                      {category.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                选择要导入的数据格式 / Select the data format to import
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
