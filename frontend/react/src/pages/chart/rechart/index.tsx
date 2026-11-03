import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy } from "react";
import { useIntl } from "react-intl";
const AreaChart = lazy(() => import('./area-chart/area-chart-index'));
const BarChart = lazy(() => import('./bar-chart/bar-chart-index'));
const LineChart = lazy(() => import('./line-chart/line-chart-index'));
const PieChart = lazy(() => import('./pie-chart/pie-chart-index'));
const RadarChart = lazy(() => import('./radar-chart/radar-chart-index'));
const RadialChart = lazy(() => import('./radial-chart/radial-chart-index'));
const Tooltips = lazy(() => import('./tooltips/tooltips-index'));

export default function Index() {
    const intl = useIntl();
    return (
        <Tabs defaultValue="area" className="p-3">
            <TabsList>
                <TabsTrigger value="area">{intl.formatMessage({ id: 'page.chart.rechart.areaChart' })}</TabsTrigger>
                <TabsTrigger value="bar">{intl.formatMessage({ id: 'page.chart.rechart.barChart' })}</TabsTrigger>
                <TabsTrigger value="line">{intl.formatMessage({ id: 'page.chart.rechart.lineChart' })}</TabsTrigger>
                <TabsTrigger value="pie">{intl.formatMessage({ id: 'page.chart.rechart.pieChart' })}</TabsTrigger>
                <TabsTrigger value="radar">{intl.formatMessage({ id: 'page.chart.rechart.radarChart' })}</TabsTrigger>
                <TabsTrigger value="radial">{intl.formatMessage({ id: 'page.chart.rechart.radialChart' })}</TabsTrigger>
                <TabsTrigger value="tooltip">{intl.formatMessage({ id: 'page.chart.rechart.tooltip' })}</TabsTrigger>
            </TabsList>
            <TabsContent value="area">
                <AreaChart />
            </TabsContent>
            <TabsContent value="bar">
                <BarChart />
            </TabsContent>
            <TabsContent value="line">
                <LineChart />
            </TabsContent>
            <TabsContent value="pie">
                <PieChart />
            </TabsContent>
            <TabsContent value="radar">
                <RadarChart />
            </TabsContent>
            <TabsContent value="radial">
                <RadialChart />
            </TabsContent>
            <TabsContent value="tooltip">
                <Tooltips />
            </TabsContent>
        </Tabs>
    );
}
