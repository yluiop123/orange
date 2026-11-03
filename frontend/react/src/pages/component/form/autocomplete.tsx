"use client";

import { AutoCompleteOption, AutoCompletePro } from "@/components/ext/autocomplete";
import * as React from "react";

export default function AutoCompleteProDemo() {
  /* =======================
   * Case 1: 基础用法 / Basic
   * ======================= */
  const [basicOptions, setBasicOptions] = React.useState<AutoCompleteOption[]>([]);

  const handleBasicSearch = (value: string) => {
    setBasicOptions(
      value
        ? [
            { value },
            { value: `${value}${value}` },
            { value: `${value}${value}${value}` },
          ]
        : []
    );
  };

  /* =======================
   * Case 2: 受控模式 / Controlled
   * ======================= */
  const [controlledValue, setControlledValue] = React.useState("");

  const controlledOptions: AutoCompleteOption[] = [
    { value: "Apple" },
    { value: "Banana" },
    { value: "Cherry" },
  ];

  /* =======================
   * Case 3: 自定义渲染 / Custom Option
   * ======================= */
  const customOptions: AutoCompleteOption[] = [
    {
      value: "vue",
      label: (
        <div className="flex justify-between">
          <span>Vue</span>
        </div>
      ),
    },
    {
      value: "react",
      label: (
        <div className="flex justify-between">
          <span>React</span>
        </div>
      ),
    },
    {
      value: "spring",
      label: (
        <div className="flex justify-between">
          <span>Spring Boot</span>
        </div>
      ),
    },
  ];

  /* =======================
   * Case 4: 异步搜索 / Async
   * ======================= */
  const [asyncOptions, setAsyncOptions] = React.useState<AutoCompleteOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleAsyncSearch = (value: string) => {
    if (!value) {
      setAsyncOptions([]);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setAsyncOptions([
        { value: `${value}@gmail.com` },
        { value: `${value}@outlook.com` },
        { value: `${value}@qq.com` },
      ]);
      setLoading(false);
    }, 800);
  };

  /* =======================
   * Case 5: 状态 & 尺寸 / Status & Size
   * ======================= */
  const sizeOptions: AutoCompleteOption[] = [
    { value: "Small" },
    { value: "Medium" },
    { value: "Large" },
  ];

  return (
    <div className="space-y-12 p-8 max-w-3xl">
      <h1 className="text-2xl font-bold">
        AutoComplete Pro 演示 / Demo
      </h1>

      {/* =======================
       * Basic
       * ======================= */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          基础用法 / Basic Usage
        </h2>
        <AutoCompletePro
          placeholder="输入内容 / Input here"
          allowClear
          options={basicOptions}
          onChange={handleBasicSearch}
        />
      </section>

      {/* =======================
       * Controlled
       * ======================= */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          受控模式 / Controlled
        </h2>
        <AutoCompletePro
          value={controlledValue}
          options={controlledOptions}
          placeholder="选择水果 / Select fruit"
          onChange={setControlledValue}
        />
        <div className="text-sm text-muted-foreground">
          当前值 / Current value: {controlledValue || "-"}
        </div>
      </section>

      {/* =======================
       * Custom Option
       * ======================= */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          自定义选项渲染 / Custom Option Render
        </h2>
        <AutoCompletePro
          options={customOptions}
          placeholder="选择技术栈 / Select tech"
        />
      </section>

      {/* =======================
       * Async
       * ======================= */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          异步搜索 / Async Search
        </h2>
        <AutoCompletePro
          placeholder="输入邮箱前缀 / Input email"
          allowClear
          loading={loading}
          options={asyncOptions}
          onChange={handleAsyncSearch}
        />
      </section>

      {/* =======================
       * Size & Status
       * ======================= */}
      <section className="space-y-4 ">
        <h2 className="text-lg font-semibold">
          尺寸 & 状态 / Size & Status
        </h2>

        <AutoCompletePro
          size="sm"
          options={sizeOptions}
          placeholder="Small"
        />
        
        <AutoCompletePro
          size="md"
          status="warning"
          options={sizeOptions}
          placeholder="Warning"
        />

        <AutoCompletePro
          size="lg"
          status="error"
          options={sizeOptions}
          placeholder="Error"
        />
      </section>
    </div>
  );
}
