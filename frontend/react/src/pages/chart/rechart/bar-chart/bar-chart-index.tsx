import { lazy } from "react";

const ChartBarDefault = lazy(() => import('./bar-chart-default').then(m => ({ default: m.ChartBarDefault })));
const ChartBarActive = lazy(() => import('./bar-chart-active').then(m => ({ default: m.ChartBarActive })));
const ChartBarLabelCustom = lazy(() => import('./bar-chart-custom-label').then(m => ({ default: m.ChartBarLabelCustom })));
const ChartBarHorizontal = lazy(() => import('./bar-chart-horizontal').then(m => ({ default: m.ChartBarHorizontal })));
const ChartBarMixed = lazy(() => import('./bar-chart-mixed').then(m => ({ default: m.ChartBarMixed })));
const ChartBarMultiple = lazy(() => import('./bar-chart-multiple').then(m => ({ default: m.ChartBarMultiple })));
const ChartBarNegative = lazy(() => import('./bar-chart-negative').then(m => ({ default: m.ChartBarNegative })));
const ChartBarStacked = lazy(() => import('./bar-chart-stacked-legend').then(m => ({ default: m.ChartBarStacked })));
const ChartBarLabel = lazy(() => import('./bar-chart-label').then(m => ({ default: m.ChartBarLabel })));
export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
      <ChartBarDefault />
      <ChartBarActive />
      <ChartBarLabelCustom />
      <ChartBarHorizontal />
      <ChartBarMixed />
      <ChartBarMultiple />
      <ChartBarNegative />
      <ChartBarStacked />
      <ChartBarLabel />
    </div>
  );
}
