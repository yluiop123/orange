import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Info, X } from "lucide-react";

export default function BadgeDemo() {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Variants 基本变体</h2>
      <div className="flex gap-4 flex-wrap">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>

      <h2 className="text-xl font-bold">With Icons 带图标</h2>
      <div className="flex gap-4 flex-wrap">
        <Badge variant="default">
          <Check className="h-3 w-3" />
          Success
        </Badge>
        <Badge variant="destructive">
          <X className="h-3 w-3" />
          Error
        </Badge>
        <Badge variant="secondary">
          <AlertTriangle className="h-3 w-3" />
          Warning
        </Badge>
        <Badge variant="outline">
          <Info className="h-3 w-3" />
          Info
        </Badge>
      </div>

      <h2 className="text-xl font-bold">As Child Element 作为子元素</h2>
      <div className="flex gap-4 items-center">
        <a href="#" className="inline-flex items-center gap-2">
          <span>Link with badge</span>
          <Badge>
            <span>New</span>
          </Badge>
        </a>
        <Button className="inline-flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600">
          <span>Button</span>
          <Badge>
            <span>5</span>
          </Badge>
        </Button>
      </div>

      <h2 className="text-xl font-bold">Custom Styles 自定义样式</h2>
      <div className="flex gap-4 flex-wrap">
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          Custom Color
        </Badge>
        <Badge className="bg-purple-500 text-white rounded-full px-3">
          Rounded Full
        </Badge>
        <Badge className="bg-yellow-500 text-black text-sm px-3 py-1">
          Larger Size
        </Badge>
      </div>

      <h2 className="text-xl font-bold">Badge in Context 上下文使用</h2>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Notifications</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>New message</span>
            <Badge variant="destructive">1</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>System update</span>
            <Badge variant="default">Available</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Task completed</span>
            <Badge variant="secondary">Done</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}