import { lazy } from "react";
const ChartLineDefault = lazy(() => import('./line-chart').then(m => ({ default: m.ChartLineDefault })));
const ChartLineLinear = lazy(() => import('./line-char-linear').then(m => ({ default: m.ChartLineLinear })));
const ChartLineStep = lazy(() => import('./line-char-step').then(m => ({ default: m.ChartLineStep })));
const ChartLineDotsCustom = lazy(() => import('./line-chart-custom-dots').then(m => ({ default: m.ChartLineDotsCustom })));
const ChartLineLabelCustom = lazy(() => import('./line-chart-custom-label').then(m => ({ default: m.ChartLineLabelCustom })));
const ChartLineDotsColors = lazy(() => import('./line-chart-dots-colors').then(m => ({ default: m.ChartLineDotsColors })));
const ChartLineDots = lazy(() => import('./line-chart-dots').then(m => ({ default: m.ChartLineDots })));
const ChartLineMultiple = lazy(() => import('./line-chart-multiple').then(m => ({ default: m.ChartLineMultiple })));
const ChartLineLabel = lazy(() => import('./line-chart-label').then(m => ({ default: m.ChartLineLabel })));

export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
      <ChartLineDefault />
      <ChartLineLinear />
      <ChartLineStep />
      <ChartLineDotsCustom />
      <ChartLineLabelCustom />
      <ChartLineDotsColors />
      <ChartLineDots />
      <ChartLineMultiple />
      <ChartLineLabel />
    </div>
  );
}
