// src/components/ext/timeline.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type TimelineItem = {
  id: string;
  title: string;
  date?: string;
  description?: string;
  icon?: LucideIcon;
};

interface TimelineProps {
  items: TimelineItem[];
  activeId: string;
  onChange: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
  mode?: 'left' | 'right' | 'alternate' | 'top' | 'bottom';
}

const Timeline = ({ 
  items, 
  activeId, 
  onChange, 
  orientation = 'vertical',
  mode = 'left' 
}: TimelineProps) => {
  const isH = orientation === 'horizontal';

  return (
    <div className={cn(
      "relative flex w-full",
      isH ? "flex-row h-48 items-center px-10" : "flex-col py-5"
    )}>
      {/* 轴线：绝对定位 */}
      <div className={cn(
        "absolute bg-slate-200 transition-all duration-500",
        isH ? "h-[2px] left-0 right-0 top-1/2 -translate-y-1/2" : "w-[2px] top-0 bottom-0 left-1/2 -translate-x-1/2"
      )} />

      {items.map((item, index) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        
        // 布局逻辑
        let position = mode;
        if (mode === 'alternate') {
          if (isH) position = index % 2 === 0 ? 'top' : 'bottom';
          else position = index % 2 === 0 ? 'left' : 'right';
        }

        return (
          <div key={item.id} className={cn(
            "relative z-10 flex flex-1 items-center justify-center",
            // 关键修复：纵向时给一个最小高度，防止图标挤在一起
            !isH && "min-h-[120px] w-full" 
          )}>
            {/* 点击圆点 */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onChange(item.id)}
              className={cn(
                "group relative flex items-center justify-center rounded-full border-2 p-0 transition-all duration-300 bg-white hover:bg-white z-20",
                isActive ? "w-10 h-10 border-blue-600 ring-4 ring-blue-50" : "w-6 h-6 border-slate-300 hover:border-blue-400"
              )}
            >
              {Icon ? <Icon className={cn(isActive ? "w-5 h-5 text-blue-600" : "w-3 h-3 text-slate-400")} /> : <div className="w-2 h-2 rounded-full bg-current" />}
            </Button>

            {/* 文字内容区域 */}
            <div className={cn(
              "absolute flex flex-col cursor-pointer transition-all duration-300",
              isActive ? "opacity-100 scale-100" : "opacity-60 scale-95",
              isH ? "w-32 text-center" : "w-[calc(50%-3rem)]",
              // 位置偏移计算
              position === 'top' && "bottom-[calc(50%+2rem)]",
              position === 'bottom' && "top-[calc(50%+2rem)]",
              position === 'left' && "right-[calc(50%+2.5rem)] text-right",
              position === 'right' && "left-[calc(50%+2.5rem)] text-left"
            )} onClick={() => onChange(item.id)}>
              <span className="text-[10px] font-bold text-blue-500 font-mono tracking-tighter">{item.date}</span>
              <h4 className={cn("text-sm font-bold truncate", isActive ? "text-slate-900" : "text-slate-600")}>{item.title}</h4>
              {isActive && !isH && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 animate-in fade-in slide-in-from-right-2">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;