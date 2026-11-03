import { Component } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';

const SOFT = ['#5b8ff9', '#5ad8a6', '#f6bd16', '#e8684a', '#6dc8ec', '#9270ca'];

@Component({
  selector: 'app-chart-antv',
  standalone: true,
  imports: [EChartComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header titleKey="page.chart.antv.title" descKey="page.chart.antv.desc">
        <span class="renderer">ECharts · AntV palette</span>
      </app-page-header>
      <div class="chart-grid">
        @for (card of cards; track card.title) {
          <section class="chart-card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.desc }}</p>
            <app-echart [option]="card.option" height="260px" [label]="card.title" />
          </section>
        }
      </div>
      <p class="note">
        The AntV G2 engine is not bundled in this port. These charts use the same
        data and a soft AntV-inspired palette rendered by ECharts.
      </p>
    </div>
  `,
  styles: [
    `
      .renderer {
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(91, 143, 249, 0.12);
        color: #3b6fd4;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .note {
        margin: 16px 2px 0;
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.78rem;
      }
    `,
  ],
})
export class ChartAntvComponent {
  readonly cards: { title: string; desc: string; option: EChartsOption }[] = [
    {
      title: 'Monthly trend',
      desc: 'Multi-series line with a soft palette',
      option: {
        color: SOFT,
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
        grid: { left: 8, right: 12, top: 20, bottom: 30, containLabel: true },
        xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] },
        yAxis: { type: 'value' },
        series: [
          { name: 'Revenue', type: 'line', smooth: true, data: [38, 46, 52, 61, 58, 72, 80, 91] },
          { name: 'Cost', type: 'line', smooth: true, data: [22, 26, 28, 33, 31, 39, 43, 47] },
        ],
      },
    },
    {
      title: 'Stacked columns',
      desc: 'Composition over time',
      option: {
        color: SOFT,
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
        grid: { left: 8, right: 12, top: 20, bottom: 30, containLabel: true },
        xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
        yAxis: { type: 'value' },
        series: [
          { name: 'Retail', type: 'bar', stack: 'total', data: [120, 132, 101, 134] },
          { name: 'Wholesale', type: 'bar', stack: 'total', data: [220, 182, 191, 234] },
          { name: 'Online', type: 'bar', stack: 'total', data: [150, 232, 201, 154] },
        ],
      },
    },
    {
      title: 'Donut',
      desc: 'Channel share',
      option: {
        color: SOFT,
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
        series: [
          {
            type: 'pie',
            radius: ['42%', '66%'],
            center: ['50%', '44%'],
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: [
              { name: 'Direct', value: 38 },
              { name: 'Search', value: 28 },
              { name: 'Social', value: 18 },
              { name: 'Referral', value: 16 },
            ],
          },
        ],
      },
    },
    {
      title: 'Nightingale rose',
      desc: 'Angular area comparison',
      option: {
        color: SOFT,
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8 },
        series: [
          {
            type: 'pie',
            roseType: 'area',
            radius: ['18%', '64%'],
            center: ['50%', '44%'],
            itemStyle: { borderRadius: 6 },
            label: { fontSize: 9 },
            data: [
              { name: 'Alpha', value: 40 },
              { name: 'Bravo', value: 32 },
              { name: 'Charlie', value: 26 },
              { name: 'Delta', value: 18 },
              { name: 'Echo', value: 12 },
            ],
          },
        ],
      },
    },
  ];
}
