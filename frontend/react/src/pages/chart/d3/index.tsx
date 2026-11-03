import * as Plot from "@observablehq/plot";
import { ObservablePlotCard } from "./observable-plot-card";
export default function Index() {

  const lineChartPlot = Plot.lineY([
    { letter: "A", frequency: 5 },
    { letter: "B", frequency: 6 },
    { letter: "C", frequency: 2 },
    { letter: "D", frequency: 7 },
    { letter: "E", frequency: 8 }
  ], { x: "letter", y: "frequency",stroke: 'var(--primary)' }).plot({
    y: { grid: true }, style: {
      fontSize: '20'
    },
    height: 400,
  })

  const barChartPlot = Plot.plot({
    style: {
      fontSize: '20'
    },
    height: 400,
    x: {
      axis: "top",
      grid: true
    },
    marks: [
      Plot.ruleX([0]),
      Plot.barX([
        { letter: "A", frequency: 5 },
        { letter: "B", frequency: 6 },
        { letter: "C", frequency: 2 },
        { letter: "D", frequency: 7 },
        { letter: "E", frequency: 8 }
      ], { x: "frequency", y: "letter",fill: 'var(--primary)', sort: { y: "x", reverse: true } })
    ]
  })
  const hChartPlot = Plot.plot({
  y: {
    grid: true,
    percent: true
  },
  marks: [
    Plot.ruleY([0]),
    Plot.barY([
        { letter: "A", frequency: 5 },
        { letter: "B", frequency: 6 },
        { letter: "C", frequency: 2 },
        { letter: "D", frequency: 7 },
        { letter: "E", frequency: 8 }
      ], {x: "letter", y: "frequency",fill: 'var(--primary)', sort: {x: "y", reverse: true}})
  ]
})
  const areaChartPlot = Plot.areaY([
    { letter: "A", frequency: 5 },
    { letter: "B", frequency: 6 },
    { letter: "C", frequency: 2 },
    { letter: "D", frequency: 7 },
    { letter: "E", frequency: 8 }
  ], { x: "letter", y: "frequency",fill: 'var(--primary)'}).plot({
    height: 400, style: {
      fontSize: '20',
    },
  })

  const dotChartPlot = Plot.dot([
    { letter: "A", frequency: 5 },
    { letter: "B", frequency: 6 },
    { letter: "C", frequency: 2 },
    { letter: "D", frequency: 7 },
    { letter: "E", frequency: 8 }
  ], { x: "letter", y: "frequency",fill: 'var(--primary)',r: 10}).plot(
    {
      height: 400,
      style: {
        fontSize: '20',
      }
    })

const treePlot = Plot.plot({
  axis: null,
  height: 400,
  margin: 10,
  marginLeft: 40,
  marginRight: 120,
  marks: [
    Plot.tree([
  "Chaos/Gaia/Mountains",
  "Chaos/Gaia/Pontus",
  "Chaos/Gaia/Uranus",
  "Chaos/Eros",
  "Chaos/Erebus",
  "Chaos/Tartarus"
], {textStroke: "white",fontSize: 30,stroke: 'var(--primary)'})
  ]
})
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
      <ObservablePlotCard plot={lineChartPlot} title="折线图" description="Line Chart" />
      <ObservablePlotCard plot={barChartPlot} title="柱状图" description="Bar Chart" />
      <ObservablePlotCard plot={hChartPlot} title="水平柱状图" description="Horizontal Bar Chart" />
      <ObservablePlotCard plot={areaChartPlot} title="面积图" description="Area Chart" />
      <ObservablePlotCard plot={dotChartPlot} title="散点图" description="Dot Chart" />
      <ObservablePlotCard plot={treePlot} title="树图" description="Tree Chart" />
    </div>
  )
}
