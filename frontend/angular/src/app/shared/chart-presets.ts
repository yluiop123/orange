import type { EChartsOption } from 'echarts';

export const PALETTE = ['#f97316', '#2563eb', '#14b8a6', '#8b5cf6', '#ef4444', '#22c55e'];

const AXIS = {
  axisLine: { lineStyle: { color: '#cbd5e1' } },
  axisLabel: { color: '#64748b', fontSize: 10 },
  splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.22)' } },
};

export function lineOption(
  labels: string[],
  series: { name: string; data: number[]; area?: boolean }[],
  smooth = true,
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: 10 },
    },
    grid: { left: 8, right: 12, top: 30, bottom: 4, containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: labels, ...AXIS },
    yAxis: { type: 'value', ...AXIS },
    series: series.map((item) => ({
      name: item.name,
      type: 'line',
      smooth,
      showSymbol: false,
      lineStyle: { width: 2 },
      areaStyle: item.area ? { opacity: 0.14 } : undefined,
      data: item.data,
    })),
  };
}

export function barOption(
  labels: string[],
  series: { name: string; data: number[] }[],
  horizontal = false,
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#64748b', fontSize: 10 },
    },
    grid: { left: 8, right: 14, top: 30, bottom: 4, containLabel: true },
    xAxis: horizontal
      ? { type: 'value', ...AXIS }
      : { type: 'category', data: labels, ...AXIS },
    yAxis: horizontal
      ? { type: 'category', data: labels, ...AXIS }
      : { type: 'value', ...AXIS },
    series: series.map((item) => ({
      name: item.name,
      type: 'bar',
      barMaxWidth: 22,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      data: item.data,
    })),
  };
}

export function pieOption(
  data: { name: string; value: number }[],
  donut = true,
  dark = false,
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: dark ? '#94a3b8' : '#64748b', fontSize: 10 },
    },
    series: [
      {
        type: 'pie',
        radius: donut ? ['46%', '68%'] : '62%',
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 6 },
        data,
      },
    ],
  };
}

export function gaugeOption(value: number, name: string, dark = false): EChartsOption {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        progress: { show: true, width: 12, itemStyle: { color: '#f97316' } },
        axisLine: { lineStyle: { width: 12, color: [[1, dark ? '#1e293b' : '#e2e8f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '38%'],
          color: dark ? '#94a3b8' : '#64748b',
          fontSize: 11,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, 0],
          formatter: '{value}%',
          color: dark ? '#f8fafc' : '#0f172a',
          fontSize: 26,
          fontWeight: 700,
        },
        data: [{ value, name }],
      },
    ],
  };
}

export function radarOption(
  indicators: { name: string; max: number }[],
  data: { name: string; value: number[] }[],
  dark = false,
): EChartsOption {
  return {
    color: PALETTE,
    tooltip: {},
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: dark ? '#94a3b8' : '#64748b', fontSize: 10 },
    },
    radar: {
      radius: '62%',
      center: ['50%', '46%'],
      indicator: indicators,
      axisName: { color: dark ? '#94a3b8' : '#64748b', fontSize: 10 },
      splitLine: {
        lineStyle: {
          color: dark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(148, 163, 184, 0.3)',
        },
      },
      splitArea: {
        areaStyle: {
          color: dark
            ? ['rgba(15, 23, 42, 0.35)', 'rgba(15, 23, 42, 0.55)']
            : ['rgba(248, 250, 252, 0.6)', 'rgba(241, 245, 249, 0.6)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: dark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(148, 163, 184, 0.3)',
        },
      },
    },
    series: [
      {
        type: 'radar',
        symbolSize: 4,
        data: data.map((item) => ({
          name: item.name,
          value: item.value,
          areaStyle: { opacity: 0.16 },
          lineStyle: { width: 2 },
        })),
      },
    ],
  };
}
