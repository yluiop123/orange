"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { HexColorPicker } from "react-colorful"

// 丰富的内置色盘数据
const PRESET_COLORS = [
  { group: "Neutral", colors: ["#000000", "#64748b", "#cbd5e1", "#ffffff"] },
  { group: "Status", colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1"] },
  { group: "Pastel", colors: ["#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#bfdbfe", "#ddd6fe"] },
]

export function ColorPicker({ color, onChange }: { color: string, onChange: (c: string) => void }) {
  // HEX 转 RGB 逻辑
  const rgb = useMemo(() => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } 
                  : { r: 0, g: 0, b: 0 }
  }, [color])

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0))
    const newRgb = { ...rgb, [channel]: num }
    onChange(`#${newRgb.r.toString(16).padStart(2, "0")}${newRgb.g.toString(16).padStart(2, "0")}${newRgb.b.toString(16).padStart(2, "0")}`)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-70 justify-between shadow-sm hover:bg-accent hover:text-accent-foreground transition-all border-input bg-background"
          />
        }
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border shadow-inner transition-transform group-hover:scale-110" style={{ backgroundColor: color }} />
          <span className="font-mono text-xs font-bold uppercase">{color}</span>
        </div>
        <div className="flex gap-1 opacity-50">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <div className="h-2 w-2 rounded-full bg-blue-400" />
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4 space-y-4 shadow-2xl border-border bg-popover text-popover-foreground">
        {/* 1. 拾色器 (Color Picker) */}
        <div className="relative rounded-lg overflow-hidden border border-border">
          <HexColorPicker color={color} onChange={onChange} className="w-full! h-36!" />
        </div>

        {/* 2. 数值输入区 */}
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">Hex Code</Label>
            <Input 
              value={color.toUpperCase()} 
              onChange={(e) => onChange(e.target.value)} 
              // 修复：确保背景使用变量，并防止 hover 变色冲突
              className="h-8 font-mono text-[11px] bg-muted/50 focus-visible:bg-background transition-colors border-none ring-1 ring-input"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch} className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground font-black text-center block">
                  {ch}
                </Label>
                <Input 
                  type="number"
                  value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, e.target.value)}
                  className="h-8 px-1 text-center font-mono text-[11px] bg-muted/50 focus-visible:bg-background border-none ring-1 ring-input"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* 3. 内置丰富色盘 */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase text-muted-foreground font-black flex justify-between">
            <span>常用预设 (Presets)</span>
            <span className="opacity-30">TAILWIND</span>
          </Label>
          <ScrollArea className="h-24 pr-2">
            <div className="space-y-4">
              {PRESET_COLORS.map((group) => (
                <div key={group.group} className="flex flex-wrap gap-2">
                  {group.colors.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant="outline"
                      size="icon"
                      className={cn(
                        "size-6 min-h-0 rounded-md border-border p-0 transition-all hover:scale-125 active:scale-90 shadow-sm relative overflow-hidden",
                        color.toLowerCase() === c.toLowerCase() && "ring-2 ring-primary ring-offset-2 ring-offset-popover"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => onChange(c)}
                      title={c}
                    >
                      {/* 如果是白色，加一个细微的内阴影防止看不见 */}
                      {c === "#ffffff" && <div className="absolute inset-0 border border-black/5 rounded-md" />}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}