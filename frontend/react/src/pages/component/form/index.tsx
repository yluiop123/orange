import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy, Suspense } from "react";

const AutoCompleteDemo = lazy(() => import('./autocomplete'));
const CascaderDemo = lazy(() => import('./cascader'));
const CheckboxDemo = lazy(() => import('./checkbox'));
const ColorPickerDemo = lazy(() => import('./colorpicker'));
const DatePickerDemo = lazy(() => import('./datepicker'));
const FormDemo = lazy(() => import('./form'));
const InputDemo = lazy(() => import('./input'));
const InputNumberDemo = lazy(() => import('./input-number'));
const MentionsDemo = lazy(() => import('./mentions'));
const RadioDemo = lazy(() => import('./radio'));
const RateDemo = lazy(() => import('./rate'));
const SelectDemo = lazy(() => import('./select'));
const SliderDemo = lazy(() => import('./slider'));
const SwitchDemo = lazy(() => import('./switch'));
const TimePickerDemo = lazy(() => import('./timepicker'));
const TransferDemo = lazy(() => import('./transfer'));
const TreeSelectDemo = lazy(() => import('./treeselect'));
const UploadDemo = lazy(() => import('./upload'));

export default function FormDemoPage() {
  return (
    <Tabs defaultValue="autocomplete" className="p-3 w-full">
      {/* 关键样式说明：
          1. flex-nowrap: 强制标签不换行，保持在一行内
          2. overflow-x-auto: 开启横向滚动
          3. no-scrollbar: 隐藏默认滚动条（需配合下方 CSS）
          4. shrink-0: 确保每个 Trigger 不会被压缩宽度
      */}
      <TabsList 
          className="
            flex w-full h-11 items-center justify-start 
            overflow-x-auto overflow-y-hidden flex-nowrap 
            bg-muted p-1 border rounded-lg
            /* tailwind-scrollbar 提供的类名 */
            scrollbar-thin 
            scrollbar-thumb-muted-foreground/20 
            scrollbar-track-transparent 
            scrollbar-thumb-rounded-full
            hover:scrollbar-thumb-muted-foreground/40
            active:scrollbar-thumb-primary/50
          "
        >
        <TabsTrigger value="autocomplete" className="shrink-0">AutoComplete</TabsTrigger>
        <TabsTrigger value="cascader" className="shrink-0">Cascader</TabsTrigger>
        <TabsTrigger value="checkbox" className="shrink-0">Checkbox</TabsTrigger>
        <TabsTrigger value="colorpicker" className="shrink-0">ColorPicker</TabsTrigger>
        <TabsTrigger value="datepicker" className="shrink-0">DatePicker</TabsTrigger>
        <TabsTrigger value="form" className="shrink-0">Form</TabsTrigger>
        <TabsTrigger value="input" className="shrink-0">Input</TabsTrigger>
        <TabsTrigger value="input-number" className="shrink-0">InputNumber</TabsTrigger>
        <TabsTrigger value="mentions" className="shrink-0">Mentions</TabsTrigger>
        <TabsTrigger value="radio" className="shrink-0">Radio</TabsTrigger>
        <TabsTrigger value="rate" className="shrink-0">Rate</TabsTrigger>
        <TabsTrigger value="select" className="shrink-0">Select</TabsTrigger>
        <TabsTrigger value="slider" className="shrink-0">Slider</TabsTrigger>
        <TabsTrigger value="switch" className="shrink-0">Switch</TabsTrigger>
        <TabsTrigger value="timepicker" className="shrink-0">TimePicker</TabsTrigger>
        <TabsTrigger value="transfer" className="shrink-0">Transfer</TabsTrigger>
        <TabsTrigger value="treeselect" className="shrink-0">TreeSelect</TabsTrigger>
        <TabsTrigger value="upload" className="shrink-0">Upload</TabsTrigger>
      </TabsList>

      {/* 下方内容区域，正常垂直滚动，不随头部横向滚动 */}
      <div className="mt-4">
        <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">加载中...</div>}>
          <TabsContent value="autocomplete"><AutoCompleteDemo /></TabsContent>
          <TabsContent value="cascader"><CascaderDemo /></TabsContent>
          <TabsContent value="checkbox"><CheckboxDemo /></TabsContent>
          <TabsContent value="colorpicker"><ColorPickerDemo /></TabsContent>
          <TabsContent value="datepicker"><DatePickerDemo /></TabsContent>
          <TabsContent value="form"><FormDemo /></TabsContent>
          <TabsContent value="input"><InputDemo /></TabsContent>
          <TabsContent value="input-number"><InputNumberDemo /></TabsContent>
          <TabsContent value="mentions"><MentionsDemo /></TabsContent>
          <TabsContent value="radio"><RadioDemo /></TabsContent>
          <TabsContent value="rate"><RateDemo /></TabsContent>
          <TabsContent value="select"><SelectDemo /></TabsContent>
          <TabsContent value="slider"><SliderDemo /></TabsContent>
          <TabsContent value="switch"><SwitchDemo /></TabsContent>
          <TabsContent value="timepicker"><TimePickerDemo /></TabsContent>
          <TabsContent value="transfer"><TransferDemo /></TabsContent>
          <TabsContent value="treeselect"><TreeSelectDemo /></TabsContent>
          <TabsContent value="upload"><UploadDemo /></TabsContent>
        </Suspense>
      </div>
    </Tabs>
  );
}