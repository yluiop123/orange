import { Cascader, CascaderOption } from "@/components/ext/cascader";
import { useState } from "react";

const OPTIONS: CascaderOption[] = [
  {
    value: "clothes",
    label: "服装",
    children: [
      { value: "mens", label: "男装", children: [{ value: "tshirt", label: "T恤" }, { value: "suit", label: "西装" }] },
      { value: "womens", label: "女装", children: [{ value: "dress", label: "连衣裙" }] },
    ],
  },
  {
    value: "food",
    label: "食物",
    children: [
      { value: "fruit", label: "水果", children: [{ value: "apple", label: "苹果" }, { value: "banana", label: "香蕉" }] },
      { value: "vegetables", label: "蔬菜", children: [{ value: "carrot", label: "胡萝卜" }, { value: "broccoli", label: "西兰花" }] },
    ],
  },
];

export default function CascaderDemo() {
  const [singleValue, setSingleValue] = useState<string[]>([]);
  const [multiValue, setMultiValue] = useState<string[][]>([]);

  return (
    <div className="p-10 space-y-8 max-w-2xl mx-auto">
      <section>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">单选模式</h3>
        <Cascader
          options={OPTIONS}
          value={singleValue}
          onChange={(val) => setSingleValue(val as string[])}
          placeholder="请选择分类..."
          className="w-80"
        />
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">多选模式</h3>
        <Cascader
          options={OPTIONS}
          value={multiValue}
          onChange={(val) => setMultiValue(val as string[][])}
          multiple={true}
          placeholder="支持多选节点..."
          className="w-80"
        />
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">自定义边框样式 (修复后)</h3>
        <Cascader
          options={OPTIONS}
          value={singleValue}
          onChange={(val) => setSingleValue(val as string[])}
          placeholder="紫色 border-2 效果"
          // 现在这里传入 border-2 会完美覆盖默认边框，不会出现双重边框
          className="w-80 border-2 border-purple-500 hover:border-purple-600 focus-within:border-purple-600 focus-within:ring-purple-100"
        />
      </section>

      <section className="pt-4 border-t">
        <div className="bg-muted/50 p-4 rounded-lg text-xs font-mono">
          <p>Single: {JSON.stringify(singleValue)}</p>
          <p className="mt-2">Multiple Count: {multiValue.length}</p>
        </div>
      </section>
    </div>
  );
}