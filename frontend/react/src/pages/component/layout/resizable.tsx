import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";

export default function ResizablePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Resizable 可调整大小布局</h1>
      <p className="text-lg text-muted-foreground">
        Resizable 组件允许用户通过拖拽手柄来调整面板的大小，适用于需要灵活调整界面布局的场景。<br/>
        <span className="text-sm text-gray-500">The Resizable component allows users to adjust panel sizes by dragging handles, suitable for scenarios requiring flexible interface layouts.</span>
      </p>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>横向调整大小 / Horizontal Resize</CardTitle>
          <CardDescription>
            两个面板水平排列，可通过拖拽手柄调整各自宽度<br/>
            <span className="text-sm text-gray-500">Two panels arranged horizontally, adjust their widths by dragging the handle</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="flex h-32 items-center justify-center p-6">
                <span className="font-semibold">侧边栏 (25%) / Sidebar (25%)</span>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75} minSize={30}>
              <div className="flex h-32 items-center justify-center p-6">
                <span className="font-semibold">主内容区 (75%) / Main Content (75%)</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>纵向调整大小 / Vertical Resize</CardTitle>
          <CardDescription>
            两个面板垂直排列，可通过拖拽手柄调整各自高度<br/>
            <span className="text-sm text-gray-500">Two panels arranged vertically, adjust their heights by dragging the handle</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResizablePanelGroup direction="vertical" className="min-h-64 rounded-lg border">
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">头部区域 (30%) / Header Area (30%)</span>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={70} minSize={25}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">内容区域 (70%) / Content Area (70%)</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>复杂嵌套布局 / Complex Nested Layout</CardTitle>
          <CardDescription>
            水平和垂直布局的嵌套组合，形成复杂的可调整界面<br/>
            <span className="text-sm text-gray-500">Nested combination of horizontal and vertical layouts to form a complex adjustable interface</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResizablePanelGroup direction="horizontal" className="min-h-64 rounded-lg border">
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">侧边栏 (30%) / Sidebar (30%)</span>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={70} minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">顶部区域 (40%) / Top Area (40%)</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={60} minSize={20}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">底部区域 (60%) / Bottom Area (60%)</span>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>三面板布局 / Triple Panel Layout</CardTitle>
          <CardDescription>
            三个面板的水平或垂直排列，都可独立调整大小<br/>
            <span className="text-sm text-gray-500">Three panels arranged horizontally or vertically, all can be independently resized</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="font-medium mb-3">水平三面板 / Horizontal Triple Panel</h3>
              <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
                <ResizablePanel defaultSize={20} minSize={15}>
                  <div className="flex h-32 items-center justify-center p-6">
                    <span className="font-semibold">面板 1 (20%) / Panel 1 (20%)</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={60} minSize={20}>
                  <div className="flex h-32 items-center justify-center p-6">
                    <span className="font-semibold">面板 2 (60%) / Panel 2 (60%)</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={20} minSize={15}>
                  <div className="flex h-32 items-center justify-center p-6">
                    <span className="font-semibold">面板 3 (20%) / Panel 3 (20%)</span>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">垂直三面板 / Vertical Triple Panel</h3>
              <ResizablePanelGroup direction="vertical" className="min-h-64 rounded-lg border">
                <ResizablePanel defaultSize={25} minSize={15}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">顶部 (25%) / Top (25%)</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50} minSize={20}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">中间 (50%) / Middle (50%)</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={15}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">底部 (25%) / Bottom (25%)</span>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>实际应用场景 / Practical Use Cases</CardTitle>
          <CardDescription>
            可调整大小布局在实际应用中的典型场景<br/>
            <span className="text-sm text-gray-500">Typical scenarios of resizable layout in practical applications</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <h3 className="font-medium">代码编辑器布局 / Code Editor Layout</h3>
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
              <ResizablePanel defaultSize={20} minSize={10}>
                <div className="flex h-64 flex-col">
                  <div className="border-b p-2 font-semibold">文件树 / File Tree</div>
                  <div className="flex-1 p-2 text-sm">
                    <div>• src/</div>
                    <div>• components/</div>
                    <div>• pages/</div>
                    <div>• utils/</div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={80} minSize={50}>
                <div className="flex h-64 flex-col">
                  <div className="border-b p-2 font-semibold">编辑器 / Editor</div>
                  <div className="flex-1 bg-muted p-4 text-sm font-mono">
                    &lt;div className="container"&gt;<br />
                    &nbsp;&nbsp;&lt;h1&gt;Hello World&lt;/h1&gt;<br />
                    &lt;/div&gt;
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
            
            <h3 className="font-medium mt-6">邮件客户端布局 / Email Client Layout</h3>
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="flex h-64 flex-col">
                  <div className="border-b p-2 font-semibold">文件夹 / Folders</div>
                  <div className="flex-1 p-2 text-sm">
                    <div>收件箱 • 12 / Inbox • 12</div>
                    <div>已发送 / Sent</div>
                    <div>草稿箱 / Drafts</div>
                    <div>垃圾邮件 / Spam</div>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={70} minSize={30}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={30} minSize={20}>
                    <div className="flex h-full flex-col">
                      <div className="border-b p-2 font-semibold">邮件列表 / Email List</div>
                      <div className="flex-1 p-2 text-sm">
                        <div>• 新年祝福</div>
                        <div>• 会议邀请</div>
                        <div>• 项目更新</div>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={70} minSize={30}>
                    <div className="flex h-full flex-col">
                      <div className="border-b p-2 font-semibold">邮件内容 / Email Content</div>
                      <div className="flex-1 p-4 text-sm">
                        这里是邮件的详细内容... / Here is the detailed email content...
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}