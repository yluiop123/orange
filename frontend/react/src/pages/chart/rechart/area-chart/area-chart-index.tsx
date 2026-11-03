import { lazy } from "react";

const ChartAreaAxes = lazy(() => import('./area-chart-axes').then(m => ({ default: m.ChartAreaAxes })));
const ChartAreaDefault = lazy(() => import('./area-chart-default').then(m => ({ default: m.ChartAreaDefault })));
const ChartAreaGradient = lazy(() => import('./area-chart-gradient').then(m => ({ default: m.ChartAreaGradient })));
const ChartAreaIcons = lazy(() => import('./area-chart-icons').then(m => ({ default: m.ChartAreaIcons })));
const ChartAreaLegend = lazy(() => import('./area-chart-legend').then(m => ({ default: m.ChartAreaLegend })));
const ChartAreaLinear = lazy(() => import('./area-chart-linear').then(m => ({ default: m.ChartAreaLinear })));
const ChartAreaStacked = lazy(() => import('./area-chart-stacked').then(m => ({ default: m.ChartAreaStacked })));
const ChartAreaStackedExpand = lazy(() => import('./area-chart-stacked-expanded').then(m => ({ default: m.ChartAreaStackedExpand })));
const ChartAreaStep = lazy(() => import('./area-chart-step').then(m => ({ default: m.ChartAreaStep })));
export default function Index() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">        
        <ChartAreaDefault/>
        <ChartAreaGradient/>
        <ChartAreaAxes/>
        <ChartAreaStep/>
        <ChartAreaLinear/>
        <ChartAreaStacked/>
        <ChartAreaStackedExpand/>
        <ChartAreaLegend/>
        <ChartAreaIcons/>
    </div>
  );
}
