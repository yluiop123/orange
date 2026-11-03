// src/components/demo/tooltip-enhanced-demo.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { AlertCircle, Command, ShieldCheck, Sparkles } from "lucide-react";

export default function TooltipEnhancedDemo() {
  return (
    <TooltipProvider delay={100}>
      <div className="p-20 bg-slate-50 min-h-[400px] flex flex-wrap gap-8 items-center justify-center">
        
        {/* 示例 1: 个人资料/状态提示 (富文本卡片) */}
        <Tooltip>
          <TooltipTrigger>
            <div className="relative cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="w-64 p-4 shadow-xl border-slate-200 bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">高级会员方案</span>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none">PRO</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                解锁所有 AI 生成功能，包含无限次高清导出和优先渲染权。
              </p>
              <div className="pt-2 border-t flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>下次计费: 2024.12.01</span>
                <span className="text-indigo-600 cursor-pointer hover:underline">管理设置</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* 示例 2: 危险操作警告 (颜色语义化) */}
        <Tooltip>
          <TooltipTrigger>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <AlertCircle className="w-4 h-4 mr-2" />
              删除项目
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-red-600 text-white border-none shadow-lg shadow-red-200">
            <p className="font-medium">此操作无法撤销！</p>
          </TooltipContent>
        </Tooltip>

        {/* 示例 3: 带有快捷键提示的黑色简约风格 */}
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="icon" className="rounded-xl bg-white border shadow-sm">
              <Command className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-3 px-3 py-1.5 bg-slate-900 text-slate-100 border-slate-800">
            <span className="text-xs font-medium">全局搜索</span>
            <div className="flex gap-1">
              <kbd className="min-w-[20px] h-5 flex items-center justify-center bg-slate-800 rounded px-1 text-[10px] font-sans border border-slate-700">⌘</kbd>
              <kbd className="min-w-[20px] h-5 flex items-center justify-center bg-slate-800 rounded px-1 text-[10px] font-sans border border-slate-700">K</kbd>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* 示例 4: 带有安全图标的验证提示 */}
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full cursor-help border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-semibold">端到端加密</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[200px] text-center italic">
            您的对话内容仅您可见，连开发者也无法读取。
          </TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
}