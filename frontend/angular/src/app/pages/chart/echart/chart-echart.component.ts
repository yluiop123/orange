import { Component } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { PALETTE, barOption, gaugeOption, lineOption, pieOption, radarOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-chart-echart',
  standalone: true,
  imports: [EChartComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header titleKey="page.chart.echart.title" descKey="page.chart.echart.desc" />
      <div class="chart-grid">
        @for (card of cards; track card.title) {
          <section class="chart-card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.desc }}</p>
            <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
          </section>
        }
      </div>
    </div>
  `,
})
export class ChartEchartComponent {
  private readonly week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  readonly cards: { title: string; desc: string; option: EChartsOption; height?: string }[] = [
    {
      title: 'Basic line',
      desc: 'A single smooth series',
      option: lineOption(this.week, [{ name: 'Visits', data: [820, 932, 901, 934, 1290, 1330, 1320] }]),
    },
    {
      title: 'Stacked area',
      desc: 'Three cumulative series',
      option: lineOption(this.week, [
        { name: 'Email', data: [120, 132, 101, 134, 90, 230, 210], area: true },
        { name: 'Union Ads', data: [220, 182, 191, 234, 290, 330, 310], area: true },
        { name: 'Video Ads', data: [150, 232, 201, 154, 190, 330, 410], area: true },
      ]),
    },
    {
      title: 'Bar chart',
      desc: 'Category comparison',
      option: barOption(this.week, [{ name: 'Orders', data: [120, 200, 150, 80, 70, 110, 130] }]),
    },
    {
      title: 'Horizontal bar',
      desc: 'Ranked categories',
      option: barOption(
        ['Search', 'Direct', 'Email', 'Social', 'Referral'],
        [{ name: 'Sessions', data: [1048, 735, 580, 484, 300] }],
        true,
      ),
    },
    {
      title: 'Doughnut',
      desc: 'Part-to-whole with a hole',
      option: pieOption([
        { name: 'Search', value: 1048 },
        { name: 'Direct', value: 735 },
        { name: 'Email', value: 580 },
        { name: 'Social', value: 484 },
        { name: 'Referral', value: 300 },
      ]),
    },
    {
      title: 'Pie',
      desc: 'Classic share chart',
      option: pieOption(
        [
          { name: 'Desktop', value: 64 },
          { name: 'Mobile', value: 28 },
          { name: 'Tablet', value: 8 },
        ],
        false,
      ),
    },
    {
      title: 'Radar',
      desc: 'Multi-axis capability comparison',
      option: radarOption(
        [
          { name: 'Speed', max: 100 },
          { name: 'Power', max: 100 },
          { name: 'Range', max: 100 },
          { name: 'Accuracy', max: 100 },
          { name: 'Durability', max: 100 },
        ],
        [
          { name: 'Model A', value: [82, 74, 88, 69, 91] },
          { name: 'Model B', value: [68, 88, 72, 84, 76] },
        ],
      ),
    },
    {
      title: 'Gauge',
      desc: 'Target completion',
      option: gaugeOption(78, 'Completion'),
      height: '240px',
    },
    {
      title: 'Scatter',
      desc: 'Correlation between two metrics',
      option: {
        color: PALETTE,
        grid: { left: 34, right: 12, top: 18, bottom: 26 },
        xAxis: { type: 'value', name: 'Load' },
        yAxis: { type: 'value', name: 'Latency' },
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'scatter',
            symbolSize: 12,
            itemStyle: { color: '#8b5cf6', opacity: 0.8 },
            data: [
              [12, 42], [18, 51], [24, 48], [31, 66], [38, 72], [44, 69], [52, 88],
              [58, 91], [63, 84], [71, 96], [78, 102], [84, 98],
            ],
          },
        ],
      },
    },
  ];
}
