import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function FlexPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Flex 弹性布局 / Flex Layout</h1>
      <p className="text-lg text-muted-foreground">
        Flex 是 CSS 的弹性盒布局模型，用于创建灵活响应式的布局结构。
        <span className="block mt-1 text-sm">
          Flex is CSS's flexible box layout model, used to create flexible and responsive layout structures.
        </span>
      </p>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Flex Row 横向布局 / Flex Row Layout</CardTitle>
          <CardDescription>
            flex-1 表示自动平分剩余空间
            <span className="block mt-1">flex-1 means automatically dividing the remaining space equally</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p>
              👉 flex-1 表示自动平分空间，相当于 span=12。
              <span className="block mt-1">👉 flex-1 means automatically dividing space equally, equivalent to span=12.</span>
            </p>
            <div className="flex gap-4">
              <div className="flex-1 bg-sky-200 p-4 rounded text-center">flex-1</div>
              <div className="flex-1 bg-rose-200 p-4 rounded text-center">flex-1</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 bg-sky-200 p-4 rounded text-center">flex-1</div>
              <div className="flex-1 bg-amber-200 p-4 rounded text-center">flex-1</div>
              <div className="flex-1 bg-emerald-200 p-4 rounded text-center">flex-1</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flex Basis 固定比例布局 / Flex Basis Layout</CardTitle>
          <CardDescription>
            使用 basis 属性设置元素的基础大小
            <span className="block mt-1">Use the basis property to set the base size of elements</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p>
              👉 basis-1/3 ≈ 33% 宽度，basis-2/3 ≈ 66% 宽度。
              <span className="block mt-1">👉 basis-1/3 ≈ 33% width, basis-2/3 ≈ 66% width.</span>
            </p>
            <div className="flex gap-4">
              <div className="basis-1/3 bg-green-200 p-4 rounded text-center">basis-1/3</div>
              <div className="basis-2/3 bg-yellow-200 p-4 rounded text-center">basis-2/3</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="basis-1/4 bg-purple-200 p-4 rounded text-center">basis-1/4</div>
              <div className="basis-1/4 bg-pink-200 p-4 rounded text-center">basis-1/4</div>
              <div className="basis-1/2 bg-indigo-200 p-4 rounded text-center">basis-1/2</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flex Offset 偏移布局 / Flex Offset Layout</CardTitle>
          <CardDescription>
            使用 margin 属性模拟偏移效果
            <span className="block mt-1">Use margin properties to simulate offset effects</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p>
              👉 ml-auto 将元素推到右侧，mr-auto 推到左侧。
              <span className="block mt-1">👉 ml-auto pushes elements to the right, mr-auto pushes to the left.</span>
            </p>
            <div className="flex gap-4">
              <div className="basis-1/3 bg-purple-200 p-4 rounded text-center">basis-1/3</div>
              <div className="basis-1/3 ml-auto bg-pink-200 p-4 rounded text-center">ml-auto</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="basis-1/4 ml-auto bg-blue-200 p-4 rounded text-center">ml-auto</div>
              <div className="basis-1/4 mr-auto bg-cyan-200 p-4 rounded text-center">mr-auto</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flex Align 对齐方式 / Flex Alignment</CardTitle>
          <CardDescription>
            使用 justify 和 items 属性控制对齐方式
            <span className="block mt-1">Use justify and items properties to control alignment</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h4 className="font-medium mb-2">水平对齐 (justify-*) / Horizontal Alignment (justify-*)</h4>
              <p className="text-sm text-muted-foreground mb-4">
                justify-start / justify-center / justify-end / justify-between / justify-around / justify-evenly
              </p>
              
              <div className="flex justify-start gap-2 h-16 bg-gray-100 p-2 rounded mb-2">
                <div className="w-16 h-10 bg-sky-300 rounded flex items-center justify-center text-xs">start</div>
              </div>
              
              <div className="flex justify-center gap-2 h-16 bg-gray-100 p-2 rounded mb-2">
                <div className="w-16 h-10 bg-amber-300 rounded flex items-center justify-center text-xs">center</div>
              </div>
              
              <div className="flex justify-end gap-2 h-16 bg-gray-100 p-2 rounded mb-2">
                <div className="w-16 h-10 bg-emerald-300 rounded flex items-center justify-center text-xs">end</div>
              </div>
              
              <div className="flex justify-between gap-2 h-16 bg-gray-100 p-2 rounded">
                <div className="w-16 h-10 bg-purple-300 rounded flex items-center justify-center text-xs">between</div>
                <div className="w-16 h-10 bg-rose-300 rounded flex items-center justify-center text-xs">between</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">垂直对齐 (items-*) / Vertical Alignment (items-*)</h4>
              <p className="text-sm text-muted-foreground mb-4">
                items-start / items-center / items-end / items-stretch
              </p>
              
              <div className="flex items-start gap-2 h-24 bg-gray-100 p-2 rounded mb-2">
                <div className="w-16 h-10 bg-sky-300 rounded flex items-center justify-center text-xs">start</div>
                <div className="w-16 h-16 bg-amber-300 rounded flex items-center justify-center text-xs">taller</div>
              </div>
              
              <div className="flex items-center gap-2 h-24 bg-gray-100 p-2 rounded mb-2">
                <div className="w-16 h-10 bg-emerald-300 rounded flex items-center justify-center text-xs">center</div>
                <div className="w-16 h-16 bg-purple-300 rounded flex items-center justify-center text-xs">taller</div>
              </div>
              
              <div className="flex items-end gap-2 h-24 bg-gray-100 p-2 rounded">
                <div className="w-16 h-10 bg-rose-300 rounded flex items-center justify-center text-xs">end</div>
                <div className="w-16 h-16 bg-indigo-300 rounded flex items-center justify-center text-xs">taller</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flex Wrap 换行布局 / Flex Wrap Layout</CardTitle>
          <CardDescription>
            使用 flex-wrap 属性控制是否换行
            <span className="block mt-1">Use flex-wrap property to control line wrapping</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 bg-gray-100 p-4 rounded">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-24 h-16 bg-blue-200 rounded flex items-center justify-center text-sm">
                  Item {i + 1}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}