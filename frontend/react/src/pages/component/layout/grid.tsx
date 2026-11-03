import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function GridPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Grid 网格布局 / Grid Layout</h1>
      <p className="text-lg text-muted-foreground">
        Grid 布局是 CSS 提供的一种二维布局系统，可以同时处理行和列的布局。
        <span className="block mt-1 text-sm">
          Grid layout is a two-dimensional layout system provided by CSS that can handle both rows and columns simultaneously.
        </span>
      </p>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>基础网格布局 / Basic Grid Layout</CardTitle>
          <CardDescription>
            使用 Tailwind CSS 的宽度类创建基本网格系统
            <span className="block mt-1">Use Tailwind CSS width classes to create basic grid systems</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-3">两列等宽布局 (12 + 12) / Two Equal Columns Layout (12 + 12)</h3>
              <div className="flex flex-wrap -mx-2">
                <div className="w-1/2 px-2">
                  <div className="bg-sky-200 p-4 rounded text-center font-medium">w-1/2 (50%)</div>
                </div>
                <div className="w-1/2 px-2">
                  <div className="bg-rose-200 p-4 rounded text-center font-medium">w-1/2 (50%)</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">三列等宽布局 (8 + 8 + 8) / Three Equal Columns Layout (8 + 8 + 8)</h3>
              <div className="flex flex-wrap -mx-2">
                <div className="w-1/3 px-2">
                  <div className="bg-green-200 p-4 rounded text-center font-medium">w-1/3 (33.33%)</div>
                </div>
                <div className="w-1/3 px-2">
                  <div className="bg-yellow-200 p-4 rounded text-center font-medium">w-1/3 (33.33%)</div>
                </div>
                <div className="w-1/3 px-2">
                  <div className="bg-purple-200 p-4 rounded text-center font-medium">w-1/3 (33.33%)</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">四列等宽布局 (6 + 6 + 6 + 6) / Four Equal Columns Layout (6 + 6 + 6 + 6)</h3>
              <div className="flex flex-wrap -mx-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1/4 px-2">
                    <div className="bg-blue-200 p-4 rounded text-center font-medium">w-1/4 (25%)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>不等宽网格布局 / Unequal Width Grid Layout</CardTitle>
          <CardDescription>
            创建不同宽度的列组合
            <span className="block mt-1">Create column combinations with different widths</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-3">一宽两窄布局 (12 + 6 + 6) / One Wide Two Narrow Layout (12 + 6 + 6)</h3>
              <div className="flex flex-wrap -mx-2">
                <div className="w-1/2 px-2">
                  <div className="bg-sky-200 p-4 rounded text-center font-medium">w-1/2 (50%)</div>
                </div>
                <div className="w-1/4 px-2">
                  <div className="bg-rose-200 p-4 rounded text-center font-medium">w-1/4 (25%)</div>
                </div>
                <div className="w-1/4 px-2">
                  <div className="bg-emerald-200 p-4 rounded text-center font-medium">w-1/4 (25%)</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">黄金比例布局 (8 + 4) / Golden Ratio Layout (8 + 4)</h3>
              <div className="flex flex-wrap -mx-2">
                <div className="w-2/3 px-2">
                  <div className="bg-amber-200 p-4 rounded text-center font-medium">w-2/3 (66.66%)</div>
                </div>
                <div className="w-1/3 px-2">
                  <div className="bg-indigo-200 p-4 rounded text-center font-medium">w-1/3 (33.33%)</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>响应式网格布局 / Responsive Grid Layout</CardTitle>
          <CardDescription>
            在不同屏幕尺寸下自动调整网格布局
            <span className="block mt-1">Automatically adjust grid layout under different screen sizes</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              在小屏幕上为单列，在中等屏幕上分为两列，在大屏幕上分为三列
              <span className="block mt-1">Single column on small screens, two columns on medium screens, three columns on large screens</span>
            </p>
            <div className="flex flex-wrap -mx-2">
              <div className="w-full md:w-1/2 lg:w-1/3 px-2">
                <div className="bg-sky-200 p-4 rounded text-center font-medium">
                  w-full → md:w-1/2 → lg:w-1/3
                </div>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3 px-2">
                <div className="bg-rose-200 p-4 rounded text-center font-medium">
                  w-full → md:w-1/2 → lg:w-1/3
                </div>
              </div>
              <div className="w-full md:w-1/2 lg:w-1/3 px-2">
                <div className="bg-green-200 p-4 rounded text-center font-medium">
                  w-full → md:w-1/2 → lg:w-1/3
                </div>
              </div>
            </div>

            <div className="flex flex-wrap -mx-2 mt-4">
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-2">
                <div className="bg-blue-200 p-4 rounded text-center font-medium">
                  Responsive Col
                </div>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-2">
                <div className="bg-purple-200 p-4 rounded text-center font-medium">
                  Responsive Col
                </div>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-2">
                <div className="bg-pink-200 p-4 rounded text-center font-medium">
                  Responsive Col
                </div>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-2">
                <div className="bg-yellow-200 p-4 rounded text-center font-medium">
                  Responsive Col
                </div>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-2">
                <div className="bg-teal-200 p-4 rounded text-center font-medium">
                  Responsive Col
                </div>
              </div>
              <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/6 px-2">
                <div className="bg-orange-200 p-4 rounded text-center font-medium">
                  Responsive Col
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSS Grid 布局 / CSS Grid Layout</CardTitle>
          <CardDescription>
            使用真正的 CSS Grid 布局系统
            <span className="block mt-1">Using the true CSS Grid layout system</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-lg border border-blue-200 flex items-center justify-center h-24"
                >
                  <span className="font-medium text-blue-800">Grid Item {i + 1}</span>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 rounded-lg border border-green-200 flex items-center justify-center h-32 md:h-20">
                <span className="font-medium text-green-800">2 cols</span>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-yellow-100 p-4 rounded-lg border border-amber-200 flex items-center justify-center h-32 md:h-40 md:row-span-2">
                <span className="font-medium text-amber-800 text-center">Row Span 2</span>
              </div>
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-4 rounded-lg border border-rose-200 flex items-center justify-center h-32 md:h-20">
                <span className="font-medium text-rose-800">2 cols</span>
              </div>
              <div className="bg-gradient-to-br from-violet-100 to-purple-100 p-4 rounded-lg border border-violet-200 flex items-center justify-center h-32 md:h-20">
                <span className="font-medium text-violet-800">2 cols</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}