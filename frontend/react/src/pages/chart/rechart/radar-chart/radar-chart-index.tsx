import { lazy } from "react";

const ChartRadarDefault = lazy(() => import('./radar-chart').then(m => ({ default: m.ChartRadarDefault })));
const ChartRadarLabelCustom = lazy(() => import('./radar-chart-custom-label').then(m => ({ default: m.ChartRadarLabelCustom })));
const ChartRadarDots = lazy(() => import('./radar-chart-dots').then(m => ({ default: m.ChartRadarDots })));
const ChartRadarGridCircleFill = lazy(() => import('./radar-chart-grid-circle-filled').then(m => ({ default: m.ChartRadarGridCircleFill })));
const ChartRadarGridCircleNoLines = lazy(() => import('./radar-chart-grid-circle-nolines').then(m => ({ default: m.ChartRadarGridCircleNoLines })));
const ChartRadarGridCircle = lazy(() => import('./radar-chart-grid-circle').then(m => ({ default: m.ChartRadarGridCircle })));
const ChartRadarGridCustom = lazy(() => import('./radar-chart-grid-custom').then(m => ({ default: m.ChartRadarGridCustom })));
const ChartRadarGridFill = lazy(() => import('./radar-chart-grid-filled').then(m => ({ default: m.ChartRadarGridFill })));
const ChartRadarGridNone = lazy(() => import('./radar-chart-grid-none').then(m => ({ default: m.ChartRadarGridNone })));
const ChartRadarLegend = lazy(() => import('./radar-chart-legend').then(m => ({ default: m.ChartRadarLegend })));
const ChartRadarLinesOnly = lazy(() => import('./radar-chart-lines-only').then(m => ({ default: m.ChartRadarLinesOnly })));
const ChartRadarMultiple = lazy(() => import('./radar-chart-multiple').then(m => ({ default: m.ChartRadarMultiple })));

export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
      <ChartRadarDefault />
      <ChartRadarLabelCustom />
      <ChartRadarDots />
      <ChartRadarGridCircleFill />
      <ChartRadarGridCircleNoLines />
      <ChartRadarGridCircle />
      <ChartRadarGridCustom />
      <ChartRadarGridFill />
      <ChartRadarGridNone />
      <ChartRadarLegend />
      <ChartRadarLinesOnly />
      <ChartRadarMultiple />
    </div>
  );
}
