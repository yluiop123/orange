import { lazy } from "react";

const ChartTooltipDefault = lazy(() => import('./tooltip-default').then(m => ({ default: m.ChartTooltipDefault })));
const ChartTooltipAdvanced = lazy(() => import('./tooltip-advanced').then(m => ({ default: m.ChartTooltipAdvanced })));
const ChartTooltipLabelCustom = lazy(() => import('./tooltip-custom-label').then(m => ({ default: m.ChartTooltipLabelCustom })));
const ChartTooltipFormatter = lazy(() => import('./tooltip-formatter').then(m => ({ default: m.ChartTooltipFormatter })));
const ChartTooltipIcons = lazy(() => import('./tooltip-icons').then(m => ({ default: m.ChartTooltipIcons })));
const ChartTooltipLabelFormatter = lazy(() => import('./tooltip-label-formatter').then(m => ({ default: m.ChartTooltipLabelFormatter })));
const ChartTooltipIndicatorLine = lazy(() => import('./tooltip-line-indicator').then(m => ({ default: m.ChartTooltipIndicatorLine })));
const ChartTooltipIndicatorNone = lazy(() => import('./tooltip-no-indicator').then(m => ({ default: m.ChartTooltipIndicatorNone })));
const ChartTooltipLabelNone = lazy(() => import('./tooltip-no-label').then(m => ({ default: m.ChartTooltipLabelNone })));

export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
      <ChartTooltipDefault />
      <ChartTooltipAdvanced />
      <ChartTooltipLabelCustom />
      <ChartTooltipFormatter />
      <ChartTooltipIcons />
      <ChartTooltipLabelFormatter />
      <ChartTooltipIndicatorLine />
      <ChartTooltipIndicatorNone />
      <ChartTooltipLabelNone />
    </div>
  );
}
