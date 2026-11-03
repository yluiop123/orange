import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

/** Thin ECharts wrapper: init, update, resize, dispose. */
@Component({
  selector: 'app-echart',
  standalone: true,
  template: `<div #host class="chart-host" [style.height]="height()" role="img" [attr.aria-label]="label()"></div>`,
  styles: [
    `
      :host {
        display: block;
      }
      .chart-host {
        width: 100%;
        min-height: 160px;
      }
    `,
  ],
})
export class EChartComponent implements AfterViewInit, OnDestroy {
  readonly option = input.required<EChartsOption>();
  readonly height = input('320px');
  readonly label = input('chart');

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private chart: echarts.ECharts | null = null;
  private observer: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const option = this.option();
      if (this.chart) {
        this.chart.setOption(option, true);
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.host().nativeElement, undefined, {
      renderer: 'canvas',
    });
    this.chart.setOption(this.option(), true);
    this.observer = new ResizeObserver(() => this.chart?.resize());
    this.observer.observe(this.host().nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.chart?.dispose();
    this.chart = null;
  }
}
