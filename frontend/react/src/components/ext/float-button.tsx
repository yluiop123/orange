import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import { ArrowUp } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface FloatingButtonProps {
  icon?: LucideIcon
  size?: "sm" | "md" | "lg"
  preset?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "left-center"
    | "right-center"
  badgeCount?: number
  scrollToTop?: boolean
  group?: {
    icon: LucideIcon
    onClick: () => void
    badgeCount?: number
    className?: string
  }[]
  onClick?: () => void
  direction?: "up" | "down" | "left" | "right" // 👈 新增
}

export default function FloatingButton({
  icon,
  size = "md",
  preset = "bottom-right",
  badgeCount,
  scrollToTop,
  group,
  onClick,
  direction = "up", // 默认向上展开
}: FloatingButtonProps) {
  const [visible, setVisible] = useState(!scrollToTop)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 回到顶部逻辑
  useEffect(() => {
    if (!scrollToTop) return
    const handler = () => setVisible(window.scrollY > 200)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [scrollToTop])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!open) return
      const el = containerRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const iconSize = size === "sm" ? 16 : size === "md" ? 24 : 28
  const padding = size === "sm" ? "p-2" : size === "md" ? "p-3" : "p-4"

  // 位置样式
  const containerClass = "fixed flex z-50"
  let presetStyle: React.CSSProperties = {}

  switch (preset) {
    case "top-left":
      presetStyle = { top: 24, left: 24 }
      break
    case "top-center":
      presetStyle = { top: 24, left: "50%", transform: "translateX(-50%)" }
      break
    case "top-right":
      presetStyle = { top: 24, right: 24 }
      break
    case "bottom-left":
      presetStyle = { bottom: 24, left: 24 }
      break
    case "bottom-center":
      presetStyle = { bottom: 24, left: "50%", transform: "translateX(-50%)" }
      break
    case "bottom-right":
      presetStyle = { bottom: 24, right: 24 }
      break
    case "left-center":
      presetStyle = { top: "50%", left: 24, transform: "translateY(-50%)" }
      break
    case "right-center":
      presetStyle = { top: "50%", right: 24, transform: "translateY(-50%)" }
      break
  }

  // 根据 direction 控制布局
  let groupClass = "flex gap-2"
  if (direction === "up") groupClass += " flex-col items-center"
  if (direction === "down") groupClass += " flex-col-reverse items-center"
  if (direction === "left") groupClass += " flex-row items-center"
  if (direction === "right") groupClass += " flex-row-reverse items-center"

  const IconComponent = icon

  return (
    <div ref={containerRef} style={presetStyle} className={`${containerClass} ${groupClass}`}>
      {/* 按钮组 */}
    {open &&
      group &&
      group.map((item, i) => (
        <div key={i} className="relative">
          <Button
            variant="default"
            size="icon"
            className={`rounded-full shadow-lg ${padding} ${item.className ?? ""}`}
            onClick={item.onClick}
          >
            <item.icon size={iconSize} />
          </Button>
          {item.badgeCount ? (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 text-xs rounded-full">
              {item.badgeCount}
            </Badge>
          ) : null}
        </div>
      ))}


      {/* 主按钮 */}
      {visible && (
        <div className="relative">
          <Button
            aria-expanded={open}
            aria-haspopup={!!group}
            variant="default"
            size="icon"
            className={`rounded-full shadow-lg ${padding}`}
            onClick={() => {
              if (scrollToTop) {
                window.scrollTo({ top: 0, behavior: "smooth" })
              } else if (group) {
                setOpen(!open)
              } else {
                onClick?.()
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && group) {
                e.preventDefault()
                setOpen(o => !o)
              }
            }}
          >
            {scrollToTop ? (
              <ArrowUp size={iconSize} />
            ) : (
              IconComponent && <IconComponent size={iconSize} />
            )}
          </Button>
          {badgeCount ? (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 text-xs rounded-full">
              {badgeCount}
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  )
}
