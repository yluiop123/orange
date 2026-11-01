"use client";

import { TourProvider, useTour } from "@/components/ext/tour";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  {
    targetId: "step-1",
    title: "第一步 (Step 1)",
    description: "这是主操作按钮，点击它可以提交表单 (This is the main action button, click it to submit).",
  },
  {
    targetId: "step-2",
    title: "第二步 (Step 2)",
    description: "在这里搜索你想要的内容 (Search for content you want here).",
    placement: "top" as const,
  }
];

function DemoContent() {
  const { startTour } = useTour();

  return (
    <div className="p-20 space-y-20">
      <Button onClick={startTour} className="bg-green-600">
        开启漫游指引 (Start Tour)
      </Button>

      <div className="flex justify-between">
        {/* 确保 ID 准确无误 */}
        <button id="step-1" className="p-4 bg-white border rounded shadow">
          主操作按钮 (Main Action)
        </button>

        <Input id="step-2" placeholder="搜索框 (Search Box)" className="max-w-xs" />
      </div>
    </div>
  );
}

export default function TourDemo() {
  return (
    <TourProvider steps={steps}>
      <DemoContent />
    </TourProvider>
  );
}