import Timeline, { TimelineItem } from "@/components/ext/timeline";
import { Globe, Heart, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

const TimelinePage = () => {
  const [activeId, setActiveId] = useState("1");

  const steps: TimelineItem[] = [
    { id: "1", title: "安全检查", date: "STEP 01", icon: ShieldCheck, description: "全系统扫描，确保环境安全可靠。" },
    { id: "2", title: "性能加速", date: "STEP 02", icon: Zap, description: "优化缓存机制，响应速度提升 200%。" },
    { id: "3", title: "全球部署", date: "STEP 03", icon: Globe, description: "多节点同步，覆盖全球 12 个时区。" },
    { id: "4", title: "客户满意", date: "STEP 04", icon: Heart, description: "7x24 小时服务，好评率达到 99%。" },
  ];

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-20 bg-slate-50/50 min-h-screen">
      
      {/* 模块 A：横向 + 上下交替 */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-4">横向上下交替 (Horizontal Alternate)</h2>
        <div className="bg-white p-12 rounded-3xl border shadow-sm">
          <Timeline items={steps} activeId={activeId} onChange={setActiveId} orientation="horizontal" mode="alternate" />
        </div>
      </section>

      {/* 模块 B：纵向 + 左右交互 (修复了图标太近的问题) */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-4">纵向左右交互 (Vertical Alternate)</h2>
        <div className="bg-white p-10 rounded-3xl border shadow-sm">
          <Timeline items={steps} activeId={activeId} onChange={setActiveId} orientation="vertical" mode="alternate" />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-10 ">
        {/* 模块 C：纵向单侧 (文字居右) */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-4">纵向单侧 (Vertical Right)</h2>
          <div className="bg-white p-8 rounded-3xl border shadow-sm h-[600px] overflow-y-auto">
            <Timeline items={steps} activeId={activeId} onChange={setActiveId} orientation="vertical" mode="right" />
          </div>
        </section>

        {/* 模块 D：横向单侧 (文字居下) */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-4">横向单侧 (Horizontal Bottom)</h2>
          <div className="bg-white p-12 rounded-3xl border shadow-sm h-[600px] flex items-center">
            <Timeline items={steps} activeId={activeId} onChange={setActiveId} orientation="horizontal" mode="bottom" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default TimelinePage;