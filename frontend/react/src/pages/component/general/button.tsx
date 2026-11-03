// ButtonDemoFull.tsx
import { Button } from "@/components/ui/button";
import { Check, Coffee, Loader2Icon } from "lucide-react";
import { useState } from "react";
export default function ButtonDemoFull() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="space-y-6 p-6">

      <h2 className="text-xl font-bold">Size 大小</h2>
      <div className="flex gap-4">
        <Button size="sm">small</Button>
        <Button size="default">default</Button>
        <Button size="lg">large</Button>
        <Button size="icon">icon</Button>
      </div>

      <h2 className="text-xl font-bold"> Type 类型</h2>
      <div className="flex gap-4 flex-wrap">
        <Button>Default</Button>
        <Button className="bg-blue-600 text-white hover:bg-blue-700">Primary 主要</Button>
        <Button className="bg-gray-200 text-gray-900 hover:bg-gray-300">Secondary 次要</Button>
        <Button className="bg-red-600 text-white hover:bg-red-700">Destructive 危险</Button>
        <Button className="bg-green-600 text-white hover:bg-green-700">Success 成功</Button>
        <Button>
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            Link 链接
          </a>
        </Button>
      </div>
      <h2 className="text-xl font-bold">Variant 变体</h2>
      <div className="flex gap-4 flex-wrap">
        <Button variant="default">default</Button>
        <Button variant="destructive">destructive</Button>
        <Button variant="outline">outline</Button>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="link">
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            Link
          </a>
        </Button>
      </div>
      <h2 className="text-xl font-bold">Status 状态</h2>
      <div className="flex gap-4 flex-wrap">
        <Button>Normal</Button>
        <Button disabled>Disabled</Button>
        <Button className="flex items-center gap-2" 
        disabled={loading} 
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}>
          {loading && <Loader2Icon className="animate-spin" />}
          {loading ? "Loading..." : "Click to Load"}
        </Button>
      </div>

      <h2 className="text-xl font-bold">Icon Button 图标按钮 </h2>
      <div className="flex gap-4 flex-wrap">
        <Button className="flex items-center gap-2">
          <Coffee size={16} />
          Icon Button
        </Button>
        <Button className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
          <Check size={16} />
          Success
        </Button>
      </div>

      <h2 className="text-xl font-bold">Square 形状</h2>
      <div className="flex gap-4 flex-wrap">
        <Button className="rounded-none">Square</Button>
        <Button className="rounded-lg">Round</Button>
        <Button className="rounded-full">Full Circle</Button>
      </div>
    </div>
  );
}
