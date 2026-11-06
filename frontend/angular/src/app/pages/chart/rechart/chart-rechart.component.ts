import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import type { EChartsOption } from 'echarts';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { PALETTE, barOption, lineOption, pieOption, radarOption } from '../../../shared/chart-presets';

interface ChartCard {
  title: string;
  desc: string;
  option: EChartsOption;
  height?: string;
}

interface NamedSeries {
  name: string;
  data: number[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DESKTOP = [186, 305, 237, 73, 209, 214];
const MOBILE = [80, 200, 120, 190, 130, 140];
const NEGATIVE = [186, 205, -207, 173, -209, 214];
const RUNNING = [450, 380, 520, 140, 600, 480];
const SWIMMING = [300, 420, 120, 550, 350, 400];

const BROWSERS: { name: string; value: number }[] = [
  { name: 'Chrome', value: 275 },
  { name: 'Safari', value: 200 },
  { name: 'Firefox', value: 187 },
  { name: 'Edge', value: 173 },
  { name: 'Other', value: 90 },
];

const RADAR_INDICATORS = MONTHS.map((name) => ({ name, max: 350 }));

/* Mid-tone colours from the shared presets: legible on both the light and
   dark card surfaces, so the inline options stay theme-neutral. */
const AXIS_TEXT = '#64748b';
const SPLIT_LINE = 'rgba(148, 163, 184, 0.22)';
const SEPARATOR = 'rgba(148, 163, 184, 0.35)';

/** Horizontal bars keep the preset but round the trailing edge instead of the top. */
function horizontalBarOption(labels: string[], series: NamedSeries[]): EChartsOption {
  const base = barOption(labels, series, true);
  return {
    ...base,
    series: series.map((item) => ({
      name: item.name,
      type: 'bar',
      barMaxWidth: 16,
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      data: item.data,
    })),
  };
}

/** Stacked columns with a legend, rounding only the top of the last series. */
function stackedBarOption(labels: string[], series: NamedSeries[]): EChartsOption {
  const base = barOption(labels, series);
  return {
    ...base,
    series: series.map((item, index) => ({
      name: item.name,
      type: 'bar',
      stack: 'total',
      barMaxWidth: 22,
      itemStyle: {
        borderRadius: index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
      },
      data: item.data,
    })),
  };
}

@Component({
  selector: 'app-chart-rechart',
  standalone: true,
  imports: [EChartComponent, MatTabsModule, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header titleKey="page.chart.rechart.title" descKey="page.chart.rechart.desc">
        <span class="renderer">ECharts · Recharts layout</span>
      </app-page-header>

      <mat-tab-group animationDuration="0ms" [mat-stretch-tabs]="false">
        <mat-tab label="面积图">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of areaCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="柱状图">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of barCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="折线图">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of lineCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="饼图">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of pieCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="雷达图">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of radarCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="径向图">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of radialCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>

        <mat-tab label="提示框">
          <ng-template matTabContent>
            <div class="chart-grid">
              @for (card of tooltipCards; track card.title) {
                <section class="chart-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.desc }}</p>
                  <app-echart [option]="card.option" [height]="card.height ?? '240px'" [label]="card.title" />
                </section>
              }
            </div>
          </ng-template>
        </mat-tab>
      </mat-tab-group>

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

      /* Global CSS hides the paginator, so let the 7 tab labels scroll instead. */
      :host ::ng-deep .mat-mdc-tab-header {
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-label-container {
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-label-container::-webkit-scrollbar {
        height: 3px;
      }
      :host ::ng-deep .mat-mdc-tab-header .mat-mdc-tab-label-container::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.5);
      }
    `,
  ],
})
export class ChartRechartComponent {
  readonly areaCards: ChartCard[] = [
    {
      title: '面积图',
      desc: '单序列面积趋势',
      option: lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP, area: true }]),
    },
    {
      title: '面积图 - 渐变',
      desc: '自上而下的渐隐填充',
      option: {
        ...lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP, area: true }]),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2.5, color: PALETTE[0] },
            itemStyle: { color: PALETTE[0] },
            areaStyle: {
              opacity: 1,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(249, 115, 22, 0.42)' },
                  { offset: 1, color: 'rgba(249, 115, 22, 0.02)' },
                ],
              },
            },
            data: DESKTOP,
          },
        ],
      },
    },
    {
      title: '面积图 - 坐标轴',
      desc: '双序列面积并显示 Y 轴刻度',
      option: {
        ...lineOption(
          MONTHS,
          [
            { name: 'Desktop', data: DESKTOP, area: true },
            { name: 'Mobile', data: MOBILE, area: true },
          ],
          false,
        ),
        yAxis: {
          type: 'value',
          splitNumber: 3,
          axisLine: { show: false },
          axisLabel: { color: AXIS_TEXT, fontSize: 10 },
          splitLine: { lineStyle: { color: SPLIT_LINE } },
        },
      },
    },
    {
      title: '面积图 - 阶梯',
      desc: 'step 连接方式填充',
      option: {
        ...lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP, area: true }], false),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            step: 'middle',
            showSymbol: false,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.14 },
            data: DESKTOP,
          },
        ],
      },
    },
    {
      title: '面积图 - 线性',
      desc: '关闭平滑的直线面积',
      option: lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP, area: true }], false),
    },
    {
      title: '面积图 - 堆叠',
      desc: '两个序列累积显示',
      option: {
        ...lineOption(MONTHS, [
          { name: 'Desktop', data: DESKTOP, area: true },
          { name: 'Mobile', data: MOBILE, area: true },
        ]),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            smooth: true,
            stack: 'total',
            showSymbol: false,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.18 },
            data: DESKTOP,
          },
          {
            name: 'Mobile',
            type: 'line',
            smooth: true,
            stack: 'total',
            showSymbol: false,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.18 },
            data: MOBILE,
          },
        ],
      },
    },
  ];

  readonly barCards: ChartCard[] = [
    {
      title: '柱状图',
      desc: '单序列圆角柱',
      option: barOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }]),
    },
    {
      title: '柱状图 - 多个',
      desc: '并排对比两个序列',
      option: barOption(MONTHS, [
        { name: 'Desktop', data: DESKTOP },
        { name: 'Mobile', data: MOBILE },
      ]),
    },
    {
      title: '柱状图 - 水平',
      desc: '横向排布分类',
      option: horizontalBarOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }]),
    },
    {
      title: '柱状图 - 堆叠 + 图例',
      desc: '累积柱并显示图例',
      option: stackedBarOption(MONTHS, [
        { name: 'Desktop', data: DESKTOP },
        { name: 'Mobile', data: MOBILE },
      ]),
    },
    {
      title: '柱状图 - 负数',
      desc: '正负值使用不同颜色',
      option: {
        color: PALETTE,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 8, right: 12, top: 24, bottom: 4, containLabel: true },
        xAxis: {
          type: 'category',
          data: MONTHS,
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: AXIS_TEXT, fontSize: 10 },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisLabel: { color: AXIS_TEXT, fontSize: 10 },
          splitLine: { lineStyle: { color: SPLIT_LINE } },
        },
        series: [
          {
            name: 'Visitors',
            type: 'bar',
            barMaxWidth: 22,
            itemStyle: { borderRadius: 4 },
            label: { show: true, position: 'top', color: AXIS_TEXT, fontSize: 9, formatter: '{b}' },
            data: NEGATIVE.map((value) => ({
              value,
              itemStyle: { color: value < 0 ? PALETTE[1] : PALETTE[0] },
            })),
          },
        ],
      },
    },
    {
      title: '柱状图 - 标签',
      desc: '柱顶显示数值',
      option: {
        ...barOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }]),
        series: [
          {
            name: 'Desktop',
            type: 'bar',
            barMaxWidth: 22,
            itemStyle: { borderRadius: [6, 6, 0, 0] },
            label: { show: true, position: 'top', color: AXIS_TEXT, fontSize: 9 },
            data: DESKTOP,
          },
        ],
      },
    },
  ];

  readonly lineCards: ChartCard[] = [
    {
      title: '折线图 - 默认',
      desc: '单条折线趋势',
      option: lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }], false),
    },
    {
      title: '折线图 - 线性',
      desc: '关闭平滑的直线',
      option: {
        ...lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }], false),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            smooth: false,
            symbol: 'none',
            lineStyle: { width: 2.5 },
            areaStyle: { opacity: 0.06 },
            data: DESKTOP,
          },
        ],
      },
    },
    {
      title: '折线图 - 阶梯',
      desc: 'step 连接方式',
      option: {
        ...lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }], false),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            step: 'middle',
            showSymbol: false,
            lineStyle: { width: 2 },
            data: DESKTOP,
          },
        ],
      },
    },
    {
      title: '折线图 - 多条折线',
      desc: '双序列对比',
      option: lineOption(MONTHS, [
        { name: 'Desktop', data: DESKTOP },
        { name: 'Mobile', data: MOBILE },
      ]),
    },
    {
      title: '折线图 - 圆点',
      desc: '显示数据点标记',
      option: {
        ...lineOption(MONTHS, [{ name: 'Desktop', data: DESKTOP }]),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            smooth: true,
            showSymbol: true,
            symbolSize: 6,
            lineStyle: { width: 2 },
            itemStyle: { color: PALETTE[2] },
            data: DESKTOP,
          },
        ],
      },
    },
    {
      title: '折线图 - 自定义颜色',
      desc: '为每条线指定颜色',
      option: {
        ...lineOption(MONTHS, [
          { name: 'Desktop', data: DESKTOP },
          { name: 'Mobile', data: MOBILE },
        ]),
        series: [
          {
            name: 'Desktop',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: PALETTE[2] },
            itemStyle: { color: PALETTE[2] },
            data: DESKTOP,
          },
          {
            name: 'Mobile',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 2, color: PALETTE[3] },
            itemStyle: { color: PALETTE[3] },
            data: MOBILE,
          },
        ],
      },
    },
  ];

  readonly pieCards: ChartCard[] = [
    {
      title: '饼图',
      desc: '浏览器访问占比',
      height: '250px',
      option: pieOption(BROWSERS, false),
    },
    {
      title: '饼图 - 环形',
      desc: '带中空圆环',
      height: '250px',
      option: pieOption(BROWSERS),
    },
    {
      title: '饼图 - 带文本',
      desc: '环形中心显示总量',
      height: '250px',
      option: {
        ...pieOption(BROWSERS),
        title: {
          text: '925',
          subtext: 'Visitors',
          left: 'center',
          top: '32%',
          textAlign: 'center',
          textStyle: { color: AXIS_TEXT, fontSize: 22, fontWeight: 700 },
          subtextStyle: { color: AXIS_TEXT, fontSize: 10 },
        },
      },
    },
    {
      title: '饼图 - 自定义标签',
      desc: '外侧标签显示百分比',
      height: '250px',
      option: {
        ...pieOption(BROWSERS),
        series: [
          {
            type: 'pie',
            radius: '58%',
            center: ['50%', '44%'],
            label: { show: true, formatter: '{b} {d}%', color: AXIS_TEXT, fontSize: 9 },
            labelLine: { lineStyle: { color: SEPARATOR } },
            itemStyle: { borderColor: SEPARATOR, borderWidth: 2, borderRadius: 4 },
            data: BROWSERS,
          },
        ],
      },
    },
    {
      title: '饼图 - 标签列表',
      desc: '右侧滚动图例列表',
      height: '250px',
      option: {
        ...pieOption(BROWSERS),
        legend: {
          type: 'scroll',
          orient: 'vertical',
          right: 4,
          top: 'middle',
          icon: 'circle',
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: AXIS_TEXT, fontSize: 10 },
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '60%'],
            center: ['38%', '50%'],
            label: { show: false },
            itemStyle: { borderColor: SEPARATOR, borderWidth: 2, borderRadius: 4 },
            data: BROWSERS,
          },
        ],
      },
    },
    {
      title: '饼图 - 无分割线',
      desc: '移除扇区描边',
      height: '250px',
      option: {
        ...pieOption(BROWSERS),
        series: [
          {
            type: 'pie',
            radius: ['46%', '68%'],
            center: ['50%', '44%'],
            label: { show: false },
            itemStyle: { borderWidth: 0 },
            data: BROWSERS,
          },
        ],
      },
    },
  ];

  readonly radarCards: ChartCard[] = [
    {
      title: '雷达图',
      desc: '单序列六月对比',
      height: '260px',
      option: radarOption(RADAR_INDICATORS, [{ name: 'Desktop', value: DESKTOP }]),
    },
    {
      title: '雷达图 - 多数据',
      desc: '两个序列叠加',
      height: '260px',
      option: radarOption(RADAR_INDICATORS, [
        { name: 'Desktop', value: DESKTOP },
        { name: 'Mobile', value: MOBILE },
      ]),
    },
    {
      title: '雷达图 - 圆点',
      desc: '显示顶点标记',
      height: '260px',
      option: {
        ...radarOption(RADAR_INDICATORS, [{ name: 'Desktop', value: DESKTOP }]),
        series: [
          {
            type: 'radar',
            symbol: 'circle',
            symbolSize: 6,
            data: [
              {
                name: 'Desktop',
                value: DESKTOP,
                areaStyle: { opacity: 0.16 },
                lineStyle: { width: 2 },
              },
            ],
          },
        ],
      },
    },
    {
      title: '雷达图 - 圆形网格',
      desc: '圆形坐标网格',
      height: '260px',
      option: {
        ...radarOption(RADAR_INDICATORS, [{ name: 'Desktop', value: DESKTOP }]),
        radar: {
          shape: 'circle',
          radius: '62%',
          center: ['50%', '46%'],
          indicator: RADAR_INDICATORS,
          axisName: { color: AXIS_TEXT, fontSize: 10 },
          splitLine: { lineStyle: { color: SEPARATOR } },
          splitArea: { show: false },
          axisLine: { lineStyle: { color: SEPARATOR } },
        },
      },
    },
    {
      title: '雷达图 - 仅线条',
      desc: '不填充区域',
      height: '260px',
      option: {
        ...radarOption(RADAR_INDICATORS, [{ name: 'Desktop', value: DESKTOP }]),
        series: [
          {
            type: 'radar',
            symbol: 'none',
            lineStyle: { width: 2 },
            data: [{ name: 'Desktop', value: DESKTOP }],
          },
        ],
      },
    },
    {
      title: '雷达图 - 填充网格',
      desc: '交替色环背景',
      height: '260px',
      option: {
        ...radarOption(RADAR_INDICATORS, [{ name: 'Desktop', value: DESKTOP }]),
        radar: {
          radius: '62%',
          center: ['50%', '46%'],
          indicator: RADAR_INDICATORS,
          axisName: { color: AXIS_TEXT, fontSize: 10 },
          splitLine: { lineStyle: { color: SPLIT_LINE } },
          splitArea: {
            areaStyle: {
              color: ['rgba(148, 163, 184, 0.06)', 'rgba(148, 163, 184, 0.14)'],
            },
          },
          axisLine: { lineStyle: { color: SPLIT_LINE } },
        },
      },
    },
  ];

  readonly radialCards: ChartCard[] = [
    {
      title: '扇形图',
      desc: '极坐标径向柱',
      height: '260px',
      option: {
        color: PALETTE,
        tooltip: { trigger: 'item' },
        polar: { radius: ['22%', '82%'], center: ['50%', '50%'] },
        angleAxis: {
          type: 'category',
          data: BROWSERS.map((item) => item.name),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
        },
        radiusAxis: {
          max: 300,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
        series: [
          {
            type: 'bar',
            coordinateSystem: 'polar',
            itemStyle: { borderRadius: 4 },
            data: BROWSERS.map((item) => item.value),
          },
        ],
      },
    },
    {
      title: '扇形图 - 文本',
      desc: '中心显示进度数值',
      height: '260px',
      option: {
        color: PALETTE,
        title: {
          text: '200',
          subtext: 'Visitors',
          left: 'center',
          top: '40%',
          textAlign: 'center',
          textStyle: { color: AXIS_TEXT, fontSize: 24, fontWeight: 700 },
          subtextStyle: { color: AXIS_TEXT, fontSize: 10 },
        },
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        series: [
          {
            type: 'pie',
            radius: ['64%', '82%'],
            center: ['50%', '50%'],
            startAngle: 90,
            label: { show: false },
            itemStyle: { borderRadius: 6, borderWidth: 0 },
            data: [
              { name: 'Visitors', value: 200, itemStyle: { color: PALETTE[1] } },
              {
                name: 'Remaining',
                value: 100,
                itemStyle: { color: 'rgba(148, 163, 184, 0.22)' },
              },
            ],
          },
        ],
      },
    },
    {
      title: '扇形图 - 形状',
      desc: '圆角扇区与间隙',
      height: '260px',
      option: {
        color: PALETTE,
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'pie',
            radius: ['34%', '82%'],
            center: ['50%', '50%'],
            startAngle: 90,
            padAngle: 3,
            label: { show: false },
            itemStyle: { borderRadius: 12 },
            data: BROWSERS,
          },
        ],
      },
    },
    {
      title: '扇形图 - 堆叠',
      desc: '径向堆叠柱',
      height: '260px',
      option: {
        color: PALETTE,
        tooltip: { trigger: 'axis' },
        legend: {
          top: 0,
          right: 0,
          icon: 'roundRect',
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: AXIS_TEXT, fontSize: 10 },
        },
        polar: { radius: ['20%', '72%'], center: ['50%', '54%'] },
        angleAxis: {
          type: 'category',
          data: MONTHS,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: AXIS_TEXT, fontSize: 10 },
        },
        radiusAxis: {
          max: 400,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
        series: [
          {
            name: 'Desktop',
            type: 'bar',
            coordinateSystem: 'polar',
            stack: 'total',
            itemStyle: { borderRadius: [0, 0, 0, 4] },
            data: DESKTOP,
          },
          {
            name: 'Mobile',
            type: 'bar',
            coordinateSystem: 'polar',
            stack: 'total',
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            data: MOBILE,
          },
        ],
      },
    },
    {
      title: '扇形图 - 网格',
      desc: '显示径向网格线',
      height: '260px',
      option: {
        color: PALETTE,
        tooltip: { trigger: 'item' },
        polar: { radius: ['20%', '82%'], center: ['50%', '50%'] },
        angleAxis: {
          type: 'category',
          data: BROWSERS.map((item) => item.name),
          axisLine: { lineStyle: { color: SEPARATOR } },
          axisTick: { show: false },
          axisLabel: { color: AXIS_TEXT, fontSize: 9 },
        },
        radiusAxis: {
          max: 300,
          axisLine: { lineStyle: { color: SEPARATOR } },
          axisTick: { show: false },
          axisLabel: { color: AXIS_TEXT, fontSize: 9 },
          splitLine: { lineStyle: { color: SPLIT_LINE } },
        },
        series: [
          {
            type: 'bar',
            coordinateSystem: 'polar',
            itemStyle: { borderRadius: 4 },
            data: BROWSERS.map((item) => item.value),
          },
        ],
      },
    },
    {
      title: '扇形图 - 标签',
      desc: '扇区显示数值',
      height: '260px',
      option: {
        color: PALETTE,
        tooltip: { trigger: 'item' },
        polar: { radius: ['20%', '78%'], center: ['50%', '50%'] },
        angleAxis: {
          type: 'category',
          data: BROWSERS.map((item) => item.name),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: AXIS_TEXT, fontSize: 10 },
        },
        radiusAxis: {
          max: 300,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
        series: [
          {
            type: 'bar',
            coordinateSystem: 'polar',
            itemStyle: { borderRadius: 4 },
            label: {
              show: true,
              position: 'inside',
              color: 'rgba(255, 255, 255, 0.92)',
              fontSize: 9,
              formatter: '{c}',
            },
            data: BROWSERS.map((item) => ({ name: item.name, value: item.value })),
          },
        ],
      },
    },
  ];

  readonly tooltipCards: ChartCard[] = [
    {
      title: '提示 - 默认',
      desc: '坐标轴触发的堆叠提示',
      option: stackedBarOption(DAYS, [
        { name: 'Running', data: RUNNING },
        { name: 'Swimming', data: SWIMMING },
      ]),
    },
    {
      title: '提示 - 高级',
      desc: '自定义 HTML 与合计',
      option: {
        ...stackedBarOption(DAYS, [
          { name: 'Running', data: RUNNING },
          { name: 'Swimming', data: SWIMMING },
        ]),
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: unknown): string => {
            const items = (Array.isArray(params) ? params : [params]) as {
              marker?: string;
              seriesName?: string;
              value?: unknown;
            }[];
            const total = items.reduce((sum, item) => sum + Number(item.value ?? 0), 0);
            const rows = items
              .map(
                (item) =>
                  `${item.marker ?? ''}${item.seriesName ?? ''} <b>${String(item.value ?? '')}</b> kcal`,
              )
              .join('<br/>');
            return `${rows}<br/><span style="color:#94a3b8">Total</span> <b>${total}</b> kcal`;
          },
        },
      },
    },
    {
      title: '提示 - 自定义标签',
      desc: '轴指示器显示日期标签',
      option: {
        ...lineOption(DAYS, [{ name: 'Running', data: RUNNING }], false),
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            lineStyle: { color: PALETTE[2], width: 1, type: 'dashed' },
            label: {
              show: true,
              backgroundColor: '#334155',
              color: '#f8fafc',
              formatter: (params: unknown): string => {
                const pointer = params as { axisValue?: string | number };
                return `Day ${String(pointer.axisValue ?? '')}`;
              },
            },
          },
        },
      },
    },
    {
      title: '提示 - 格式化',
      desc: '数值附带单位',
      option: {
        ...barOption(DAYS, [{ name: 'Running', data: RUNNING }]),
        tooltip: {
          trigger: 'axis',
          valueFormatter: (value: unknown): string => `${String(value)} kcal`,
        },
      },
    },
    {
      title: '提示 - 图标',
      desc: '提示框显示彩色标记',
      height: '250px',
      option: {
        ...pieOption(
          [
            { name: 'Running', value: 2160 },
            { name: 'Swimming', value: 2040 },
            { name: 'Cycling', value: 1480 },
          ],
          true,
        ),
        tooltip: {
          trigger: 'item',
          formatter: '{b}<br/>{marker} {c} kcal ({d}%)',
        },
      },
    },
    {
      title: '提示 - 无指示器',
      desc: '关闭轴指示线',
      option: {
        ...lineOption(DAYS, [{ name: 'Running', data: RUNNING }], false),
        tooltip: { trigger: 'axis', axisPointer: { type: 'none' } },
      },
    },
  ];
}
