"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useState } from "react"

// 定义选项数据
const items = [
  { id: "react", label: "React.js" },
  { id: "vue", label: "Vue.js" },
  { id: "typescript", label: "TypeScript" },
  { id: "tailwind", label: "Tailwind CSS" },
] as const

export default function MultiCheckboxDemo() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id])
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== id))
    }
  }

  return (
    <div className="p-6 max-w-sm mx-auto border rounded-xl shadow-sm bg-background text-foreground mt-10 transition-colors">
      <h3 className="text-lg font-semibold mb-4 tracking-tight">
        选择你的技术栈 (Select Stack)
      </h3>
      
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 group">
            <Checkbox
              id={item.id}
              checked={selectedItems.includes(item.id)}
              onCheckedChange={(checked) => handleCheckboxChange(item.id, checked as boolean)}
            />
            <Label
              htmlFor={item.id}
              className={cn(
                "text-sm font-medium leading-none cursor-pointer transition-colors",
                "group-hover:text-primary", // 悬停时使用主题色
                selectedItems.includes(item.id) ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>

      {/* 交互结果展示区 */}
      <div className="mt-6 pt-4 border-t border-dashed border-border">
        <p className="text-[10px] text-muted-foreground mb-3 font-mono uppercase tracking-widest">
          Selected Data
        </p>
        
        <div className="flex flex-wrap gap-2">
          {selectedItems.length > 0 ? (
            selectedItems.map((id) => (
              <span 
                key={id} 
                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
              >
                {id}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic font-light">
              暂未选择 (No selection)
            </span>
          )}
        </div>

        {/* 原始 JSON 调试展示 */}
        {selectedItems.length > 0 && (
          <pre className="mt-4 p-2 rounded bg-muted text-[10px] text-muted-foreground overflow-x-auto">
            {JSON.stringify(selectedItems)}
          </pre>
        )}
      </div>
    </div>
  )
}