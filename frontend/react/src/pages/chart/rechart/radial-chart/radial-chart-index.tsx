import { lazy } from "react";

const ChartRadialSimple = lazy(() => import('./radial-chart').then(m => ({ default: m.ChartRadialSimple })));
const ChartRadialGrid = lazy(() => import('./radial-chart-grid').then(m => ({ default: m.ChartRadialGrid })));
const ChartRadialLabel = lazy(() => import('./radial-chart-label').then(m => ({ default: m.ChartRadialLabel })));
const ChartRadialShape = lazy(() => import('./radial-chart-shape').then(m => ({ default: m.ChartRadialShape })));
const ChartRadialStacked = lazy(() => import('./radial-chart-stacked').then(m => ({ default: m.ChartRadialStacked })));
const ChartRadialText = lazy(() => import('./radial-chart-text').then(m => ({ default: m.ChartRadialText })));

export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
      <ChartRadialSimple />
      <ChartRadialGrid />
      <ChartRadialLabel />
      <ChartRadialShape />
      <ChartRadialStacked />
      <ChartRadialText />
    </div>
  );
}
