import { Steps } from "@/components/ext/steps";
import { Check } from "lucide-react";
import { useState } from "react";

export default function StepsDemo() {
  const [current, setCurrent] = useState(1);

  return (
    <div className="space-y-8">
      {/* 横向 */}
      <Steps
        current={current}
        onChange={setCurrent}
        items={[
          { title: "登录" },
          { title: "验证", description: "安全校验中" },
          { title: "完成", icon: <Check size={14} /> },
        ]}
      />

      {/* small + vertical */}
      <Steps
        size="small"
        direction="vertical"
        current={2}
        items={[
          { title: "提交" },
          { title: "审核中", status: "process" },
          { title: "失败", status: "error" },
        ]}
      />
    </div>
  );
}
