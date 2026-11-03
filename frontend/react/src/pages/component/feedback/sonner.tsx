import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SonnerDemo() {
  const [loading, setLoading] = useState(false);
  type Position =
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
  const [position, setPosition] = useState<Position>("top-right");

  const handlePromise = () => {
    const promise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 2000);
    });

    toast.promise(
      promise,
      {
        loading: "Saving... / 保存中",
        success: "Saved! / 已保存",
        error: "Failed / 失败",
      }
    );
  };

  return (
    <div className="space-y-10 p-8 max-w-4xl mx-auto">
      {/* Using global Toaster (mounted in App). Per-toast position is passed to `toast` calls. */}

      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Sonner / 提示（Toast）</h1>
        <p className="text-muted-foreground mt-2">
          使用 Sonner 快速展示通知提示 / Use Sonner to show toast notifications.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic / 基础用法</h2>
        <div className="bg-card p-6 rounded-lg border flex gap-4">
          <Button onClick={() => toast("Hello from Sonner / 来自 Sonner 的提示", { position })}>Basic</Button>
          <Button variant="outline" onClick={() => toast.success("Saved successfully / 保存成功", { position })}>Success</Button>
          <Button variant="destructive" onClick={() => toast.error("Something went wrong / 出错了", { position })}>Error</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Promise / 异步提示</h2>
        <div className="bg-card p-6 rounded-lg border flex gap-4 items-center">
          <Button
            onClick={() => {
              setLoading(true);
              handlePromise();
              setTimeout(() => setLoading(false), 2000);
            }}
            className="flex items-center gap-2"
          >
            {loading && <Loader2Icon className="animate-spin" />}
            {loading ? "Working..." : "Run Promise"}
          </Button>
          <p className="text-sm text-muted-foreground">Use toast.promise to reflect async status / 使用 toast.promise 显示异步状态</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Placement / 位置</h2>
        <div className="bg-card p-6 rounded-lg border flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Change toaster position and show a toast at that position.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                  setPosition("top-right");
                  toast("Top Right / 右上", { position: "top-right" });
                }}
            >
              Top Right
            </Button>
            <Button
              onClick={() => {
                setPosition("top-center");
                toast("Top Center / 顶部居中", { position: "top-center" });
              }}
            >
              Top Center
            </Button>
            <Button
              onClick={() => {
                setPosition("top-left");
                toast("Top Left / 左上", { position: "top-left" });
              }}
            >
              Top Left
            </Button>
            <Button
              onClick={() => {
                setPosition("bottom-right");
                toast("Bottom Right / 右下", { position: "bottom-right" });
              }}
            >
              Bottom Right
            </Button>
            <Button
              onClick={() => {
                setPosition("bottom-center");
                toast("Bottom Center / 底部居中", { position: "bottom-center" });
              }}
            >
              Bottom Center
            </Button>
            <Button
              onClick={() => {
                setPosition("bottom-left");
                toast("Bottom Left / 左下", { position: "bottom-left" });
              }}
            >
              Bottom Left
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Current position: {position}</p>
        </div>
      </section>
    </div>
  );
}
