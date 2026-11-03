import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export default function ProgressDemo() {
  const [value, setValue] = useState(40);
  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Progress / 进度条</h1>
        <p className="text-muted-foreground mt-2">展示任务进度。</p>
      </div>

      <section className="bg-card p-6 rounded-lg border space-y-6">
        <h2 className="text-xl font-semibold">Determinate / 确定进度</h2>
        <div className="space-y-4">
          <Progress value={value} className="h-3" />
          <div className="flex gap-2">
            <Button onClick={() => setValue(v => Math.max(0, v - 10))}>-10</Button>
            <Button onClick={() => setValue(v => Math.min(100, v + 10))}>+10</Button>
            <Button onClick={() => setValue(0)}>Reset</Button>
          </div>
        </div>

        <h2 className="text-xl font-semibold pt-4">Indeterminate / 不确定进度</h2>
        <div className="space-y-3">
          <div className="h-3 w-full overflow-hidden rounded-full bg-primary/20">
            <div className="h-3 w-1/3 bg-primary animate-[progress-indeterminate_1.2s_linear_infinite]" />
          </div>
          <p className="text-sm text-muted-foreground">Use an animated stripe for unknown-length tasks.</p>
        </div>
      </section>
    </div>
  );
}
