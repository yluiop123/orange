import { lazy } from "react";

const ChartPieSimple = lazy(() => import('./pie-chart').then(m => ({ default: m.ChartPieSimple })));
const ChartPieLabelCustom = lazy(() => import('./pie-chart-custom-label').then(m => ({ default: m.ChartPieLabelCustom })));
const ChartPieDonutText = lazy(() => import('./pie-chart-donut').then(m => ({ default: m.ChartPieDonutText })));
const ChartPieInteractive = lazy(() => import('./pie-chart-interactive').then(m => ({ default: m.ChartPieInteractive })));
const ChartPieLabelList = lazy(() => import('./pie-chart-label-list').then(m => ({ default: m.ChartPieLabelList })));
const ChartPieLabel = lazy(() => import('./pie-chart-label').then(m => ({ default: m.ChartPieLabel })));
const ChartPieLegend = lazy(() => import('./pie-chart-legend').then(m => ({ default: m.ChartPieLegend })));
const ChartPieSeparatorNone = lazy(() => import('./pie-chart-separato-none').then(m => ({ default: m.ChartPieSeparatorNone })));
const ChartPieStacked = lazy(() => import('./pie-chart-stacked').then(m => ({ default: m.ChartPieStacked })));
export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
      <ChartPieSimple />
      <ChartPieLabelCustom />
      <ChartPieDonutText />
      <ChartPieInteractive />
      <ChartPieLabelList />
      <ChartPieLabel />
      <ChartPieLegend />
      <ChartPieSeparatorNone />
      <ChartPieStacked />
    </div>
  );
}
