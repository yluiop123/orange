import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Loader2Icon, X } from "lucide-react";
import { useState } from "react";

export default function DrawerDemo() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="space-y-10 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Drawer / 抽屉</h1>
        <p className="text-muted-foreground mt-2">
          Drawer 用于在当前页面内侧滑展示内容，常用于表单或详情侧栏 / A panel that slides in from the edge of the screen.
        </p>
      </div>

      {/* 基础用法 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Usage / 基础用法</h2>
        <div className="bg-card p-6 rounded-lg border">
          <Drawer>
            <DrawerTrigger>
              <Button>Open Drawer</Button>
            </DrawerTrigger>

            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Details / 详情</DrawerTitle>
                <DrawerDescription>
                  A simple drawer example with header, description and footer. / 带标题、描述与尾部的简单示例。
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  This is the drawer content area. Put forms or details here. / 这是抽屉内容区域，可放表单或详情。
                </p>
              </div>

              <DrawerFooter>
                <div className="flex w-full justify-end gap-2">
                  <DrawerClose>
                    <Button variant="outline">Cancel / 取消</Button>
                  </DrawerClose>
                  <Button>Confirm / 确认</Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </section>

      {/* 受控模式 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Controlled / 受控模式</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex gap-4">
            <Button onClick={() => setOpen(true)}>Open Controlled Drawer</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DrawerTitle>UserName/用户名</DrawerTitle>
                    <DrawerDescription>Controlled example / 受控示例</DrawerDescription>
                  </div>
                  <DrawerClose>
                    <Button variant="ghost">
                      <X />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <div className="p-4">
                <p className="text-sm text-muted-foreground">Controlled drawer content.</p>
              </div>

              <DrawerFooter>
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => alert("Saved")}>Save</Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </section>

      {/* Loading 状态 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading State / 加载状态</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setLoading(true);
                setOpen(true);
                setTimeout(() => setLoading(false), 2000);
              }}
            >
              Open (with loading)
            </Button>
          </div>

          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Processing / 处理中</DrawerTitle>
                <DrawerDescription>Shows a disabled action while loading / 加载时禁用操作</DrawerDescription>
              </DrawerHeader>

              <div className="p-4">
                <p className="text-sm text-muted-foreground">Simulate a short task.</p>
              </div>

              <DrawerFooter>
                <div className="flex w-full justify-end gap-2">
                  <DrawerClose>
                    <Button variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </DrawerClose>
                  <Button
                    disabled={loading}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 2000);
                    }}
                    className="flex items-center gap-2"
                  >
                    {loading && <Loader2Icon className="animate-spin" />}
                    {loading ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </section>

      {/* 错误状态 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error State / 错误状态</h2>
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setHasError(false);
                setOpen(true);
              }}
            >
              Open Drawer
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setHasError(true);
                setOpen(true);
              }}
            >
              Open with Error
            </Button>
          </div>

          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{hasError ? "Error / 错误" : "Info / 信息"}</DrawerTitle>
                <DrawerDescription>
                  {hasError
                    ? "An error occurred while loading the data. / 加载数据时发生错误。"
                    : "Normal drawer content. / 常规抽屉内容。"}
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-4">
                {hasError ? (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">Failed to load details.</div>
                ) : (
                  <p className="text-sm text-muted-foreground">Everything looks good.</p>
                )}
              </div>

              <DrawerFooter>
                <div className="flex w-full justify-end gap-2">
                  <DrawerClose>
                    <Button variant="outline">Close</Button>
                  </DrawerClose>
                  <Button disabled={hasError ? true : false} className="">
                    Proceed
                  </Button>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </section>

      {/* 方向与尺寸 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Directions & Sizes / 方向与尺寸</h2>
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <p className="text-sm text-muted-foreground">Drawers can slide from any edge. Each example below is independent.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DirectionExample direction="top" label="Top / 顶部" />
            <DirectionExample direction="bottom" label="Bottom / 底部" />
            <DirectionExample direction="left" label="Left / 左侧" />
            <DirectionExample direction="right" label="Right / 右侧" />
          </div>
        </div>
      </section>
    </div>
  );
}

function DirectionExample({
  direction,
  label,
}: {
  direction: "top" | "bottom" | "left" | "right";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-2">
      <Drawer direction={direction} open={open} onOpenChange={setOpen}>
        <DrawerTrigger>
          <Button>{label}</Button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label}</DrawerTitle>
            <DrawerDescription>Direction: {direction}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">Content from {direction}.</div>
          <DrawerFooter>
            <div className="flex w-full justify-end">
              <DrawerClose>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

