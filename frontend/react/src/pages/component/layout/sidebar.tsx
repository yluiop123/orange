import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

const items = [
  { title: "Home / 首页", icon: Home },
  { title: "Inbox / 收件箱", icon: Inbox },
  { title: "Calendar / 日历", icon: Calendar },
  { title: "Search / 搜索", icon: Search },
  { title: "Settings / 设置", icon: Settings },
]

export default function SidebarPage() {
  return (
    <>
    <h2 className="text-xl font-semibold">🔽 Sidebar / 侧边栏（垂直导航）</h2>
    <div className="flex h-full w-full items-stretch p-6 bg-background text-foreground">
      {/* 左侧局部菜单 / Local Sidebar */}
      <Card className="w-56 flex flex-col border bg-card shadow-sm">
        <div className="p-3 text-base font-semibold border-b">子页面菜单 / Local Menu</div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {items.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* 右侧内容 / Right Content */}
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold mb-2">内嵌 Sidebar 示例 / Embedded Sidebar Example</h2>
        <p className="text-muted-foreground">
          这个侧边栏完全独立，不会影响全局布局。<br />
          This sidebar is fully local and won’t interfere with the global sidebar.
        </p>
      </div>
    </div>
    </>
  )
}
