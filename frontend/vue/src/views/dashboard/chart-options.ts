import type { EChartsOption } from 'echarts'

export const PALETTE = ['#ea580c', '#0ea5e9', '#16a34a', '#eab308', '#8b5cf6', '#ec4899']

type SeriesInput = { name: string; data: number[]; color?: string }

const baseGrid = { left: 44, right: 20, top: 36, bottom: 30 }

export function lineOption(
  categories: string[],
  series: SeriesInput[],
  options: { area?: boolean; smooth?: boolean; stacked?: boolean } = {},
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
    grid: baseGrid,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLine: { lineStyle: { color: 'rgba(128,128,140,0.35)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } },
    },
    series: series.map((item) => ({
      name: item.name,
      type: 'line',
      smooth: options.smooth ?? true,
      showSymbol: false,
      stack: options.stacked ? 'total' : undefined,
      areaStyle: options.area ? { opacity: 0.16 } : undefined,
      lineStyle: item.color ? { color: item.color, width: 2.4 } : { width: 2.4 },
      itemStyle: item.color ? { color: item.color } : undefined,
      data: item.data,
    })),
  }
}

export function barOption(
  categories: string[],
  series: SeriesInput[],
  options: { horizontal?: boolean; stacked?: boolean } = {},
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
    grid: baseGrid,
    xAxis: options.horizontal
      ? { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } }
      : {
          type: 'category',
          data: categories,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: 'rgba(128,128,140,0.35)' } },
        },
    yAxis: options.horizontal
      ? {
          type: 'category',
          data: categories,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: 'rgba(128,128,140,0.35)' } },
        }
      : { type: 'value', splitLine: { lineStyle: { color: 'rgba(128,128,140,0.18)' } } },
    series: series.map((item) => ({
      name: item.name,
      type: 'bar',
      stack: options.stacked ? 'total' : undefined,
      barMaxWidth: 26,
      itemStyle: { borderRadius: [6, 6, 0, 0], color: item.color },
      data: item.data,
    })),
  }
}

export function pieOption(
  data: Array<{ name: string; value: number }>,
  options: { donut?: boolean } = {},
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
    series: [
      {
        type: 'pie',
        radius: options.donut ? ['46%', '68%'] : ['0%', '64%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
        label: { show: !options.donut, formatter: '{b}\n{d}%' },
        data,
      },
    ],
  }
}

export function radarOption(
  indicators: Array<{ name: string; max: number }>,
  values: number[],
  name: string,
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: {},
    radar: {
      indicator: indicators,
      radius: '64%',
      splitLine: { lineStyle: { color: 'rgba(128,128,140,0.2)' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
    },
    series: [
      {
        type: 'radar',
        name,
        data: [{ value: values, name }],
        areaStyle: { opacity: 0.22 },
        lineStyle: { width: 2 },
      },
    ],
  }
}

export function gaugeOption(value: number, name: string): EChartsOption {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        progress: { show: true, width: 14, roundCap: true },
        axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(128,128,140,0.18)']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { width: 4 },
        anchor: { show: true, size: 10 },
        detail: {
          valueAnimation: true,
          fontSize: 30,
          offsetCenter: [0, '62%'],
          formatter: '{value}%',
        },
        title: { offsetCenter: [0, '88%'], fontSize: 12 },
        data: [{ value, name }],
      },
    ],
  }
}
