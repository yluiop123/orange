import FloatingButton from "@/components/ext/float-button";
import { Edit, Plus, Trash } from "lucide-react";

export default function FloatButtonPage() {
  return (
    <div className="min-h-[1200px] bg-gray-50 p-6 w-full">
      <p className="mb-12">页面内容很长，可以滚动。示例展示回到顶部、不同位置与展开方向。</p>

      {/* 回到顶部按钮 */}
      <FloatingButton scrollToTop preset="bottom-center" />

      {/* 右中向左展开 */}
      <FloatingButton
        icon={Plus}
        size="lg"
        direction="left"
        preset="right-center"
        group={[
          { icon: Edit, onClick: () => alert("编辑"), badgeCount: 2 },
          { icon: Trash, onClick: () => alert("删除"), badgeCount: 5 },
        ]}
      />

      {/* 右下向上展开 */}
      <FloatingButton
        icon={Plus}
        size="lg"
        direction="up"
        preset="bottom-right"
        group={[
          { icon: Edit, onClick: () => alert("编辑"), badgeCount: 2 },
          { icon: Trash, onClick: () => alert("删除"), badgeCount: 5 },
        ]}
      />

      {/* 左中向右展开 示例 */}
      <FloatingButton
        icon={Plus}
        size="md"
        direction="right"
        preset="left-center"
        group={[
          { icon: Edit, onClick: () => alert("编辑 - 左侧"), badgeCount: 1 },
        ]}
      />

      <div className="mt-8">
        <h3 className="text-lg font-medium">演示说明</h3>
        <ul className="list-disc pl-6 text-sm text-muted-foreground mt-2">
          <li>主按钮支持回到顶部、展开按钮组或自定义点击回调。</li>
          <li>组按钮支持徽章计数与自定义样式。</li>
          <li>按下主按钮或按键 Enter/Space 可展开/收起组，按 Esc 或点击外部可关闭。</li>
        </ul>
      </div>
    </div>
  );
}
