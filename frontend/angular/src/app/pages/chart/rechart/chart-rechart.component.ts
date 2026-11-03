import { Component } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { PALETTE, barOption, lineOption, pieOption, radarOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-chart-rechart',
  standalone: true,
  imports: [EChartComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header titleKey="page.chart.rechart.title" descKey="page.chart.rechart.desc">
        <span class="renderer">ECharts · Recharts layout</span>
      </app-page-header>
      <div class="chart-grid">
        @for (card of cards; track card.title) {
          <section class="chart-card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.desc }}</p>
            <app-echart [option]="card.option" height="250px" [label]="card.title" />
          </section>
        }
      </div>
      <p class="note">
        Recharts is React-only, so this port reproduces the gallery with ECharts
        using the same datasets and card layout.
      </p>
    </div>
  `,
  styles: [
    `
      .renderer {
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(20, 184, 166, 0.12);
        color: #0f766e;
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
export class ChartRechartComponent {
  private readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  readonly cards: { title: string; desc: string; option: EChartsOption }[] = [
    {
      title: 'Area chart',
      desc: 'Gradient-style area with two series',
      option: lineOption(
        this.months,
        [
          { name: 'Desktop', data: [186, 305, 237, 73, 209, 214], area: true },
          { name: 'Mobile', data: [80, 200, 120, 190, 130, 140], area: true },
        ],
        false,
      ),
    },
    {
      title: 'Bar chart',
      desc: 'Rounded bars with a legend',
      option: barOption(this.months, [
        { name: 'Success', data: [120, 200, 150, 80, 170, 210] },
        { name: 'Failed', data: [20, 40, 30, 16, 26, 38] },
      ]),
    },
    {
      title: 'Line chart',
      desc: 'Dots and smooth curves',
      option: {
        ...lineOption(this.months, [
          { name: 'Page views', data: [140, 220, 180, 260, 240, 300] },
        ]),
        series: [
          {
            type: 'line',
            smooth: true,
            symbolSize: 6,
            lineStyle: { width: 2.5, color: PALETTE[0] },
            itemStyle: { color: PALETTE[0] },
            data: [140, 220, 180, 260, 240, 300],
          },
        ],
      },
    },
    {
      title: 'Pie chart',
      desc: 'Share of visits by device',
      option: pieOption(
        [
          { name: 'Desktop', value: 540 },
          { name: 'Mobile', value: 320 },
          { name: 'Tablet', value: 140 },
        ],
        false,
      ),
    },
    {
      title: 'Radar chart',
      desc: 'Two models across five axes',
      option: radarOption(
        [
          { name: 'Speed', max: 100 },
          { name: 'Power', max: 100 },
          { name: 'Range', max: 100 },
          { name: 'Accuracy', max: 100 },
          { name: 'Durability', max: 100 },
        ],
        [
          { name: 'A', value: [88, 72, 91, 64, 80] },
          { name: 'B', value: [66, 90, 70, 88, 74] },
        ],
      ),
    },
    {
      title: 'Radial bar',
      desc: 'Concentric progress rings',
      option: {
        color: PALETTE,
        series: [
          {
            type: 'pie',
            radius: ['30%', '80%'],
            center: ['50%', '50%'],
            startAngle: 90,
            label: { show: false },
            itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            data: [
              { name: 'Storage', value: 72 },
              { name: 'Compute', value: 58 },
              { name: 'Network', value: 44 },
              { name: 'Cache', value: 33 },
            ],
          },
        ],
      },
    },
  ];
}
