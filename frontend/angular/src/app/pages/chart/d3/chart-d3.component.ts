import { Component } from '@angular/core';
import { arc, curveMonotoneX, max, pie, scaleBand, scaleLinear, line, type PieArcDatum } from 'd3';
import { PageHeaderComponent } from '../../../shared/page-header.component';

interface BarPoint {
  label: string;
  value: number;
}

interface ScatterPoint {
  x: number;
  y: number;
  r: number;
}

@Component({
  selector: 'app-chart-d3',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './chart-d3.component.html',
  styleUrl: './chart-d3.component.scss',
})
export class ChartD3Component {
  readonly width = 560;
  readonly height = 280;
  readonly margin = { top: 20, right: 18, bottom: 38, left: 46 };
  readonly innerWidth = this.width - this.margin.left - this.margin.right;
  readonly innerHeight = this.height - this.margin.top - this.margin.bottom;

  private readonly barSource: BarPoint[] = [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 200 },
    { label: 'Wed', value: 150 },
    { label: 'Thu', value: 80 },
    { label: 'Fri', value: 170 },
    { label: 'Sat', value: 210 },
    { label: 'Sun', value: 190 },
  ];

  private readonly xBand = scaleBand<string>()
    .domain(this.barSource.map((item) => item.label))
    .range([0, this.innerWidth])
    .padding(0.32);

  private readonly yBar = scaleLinear()
    .domain([0, max(this.barSource, (item) => item.value) ?? 1])
    .nice()
    .range([this.innerHeight, 0]);

  readonly bars = this.barSource.map((item) => {
    const x = this.xBand(item.label) ?? 0;
    const y = this.yBar(item.value);
    return {
      ...item,
      x,
      y,
      w: this.xBand.bandwidth(),
      h: this.innerHeight - y,
    };
  });

  readonly barTicks = this.yBar.ticks(5).map((value) => ({
    value,
    y: this.yBar(value),
  }));

  private readonly lineSource = [
    { x: 0, y: 18 }, { x: 1, y: 34 }, { x: 2, y: 28 }, { x: 3, y: 46 },
    { x: 4, y: 58 }, { x: 5, y: 52 }, { x: 6, y: 74 }, { x: 7, y: 88 },
    { x: 8, y: 82 }, { x: 9, y: 96 },
  ];

  private readonly xLine = scaleLinear()
    .domain([0, 9])
    .range([0, this.innerWidth]);

  private readonly yLine = scaleLinear()
    .domain([0, 100])
    .range([this.innerHeight, 0]);

  readonly linePath =
    line<{ x: number; y: number }>()
      .x((point) => this.xLine(point.x))
      .y((point) => this.yLine(point.y))
      .curve(curveMonotoneX)(this.lineSource) ?? '';

  readonly areaPath =
    (line<{ x: number; y: number }>()
      .x((point) => this.xLine(point.x))
      .y((point) => this.yLine(point.y))
      .curve(curveMonotoneX)(this.lineSource) ?? '') +
    ` L ${this.xLine(9)} ${this.innerHeight} L ${this.xLine(0)} ${this.innerHeight} Z`;

  readonly lineTicks = this.yLine.ticks(5).map((value) => ({
    value,
    y: this.yLine(value),
  }));

  readonly lineDots = this.lineSource.map((point) => ({
    ...point,
    cx: this.xLine(point.x),
    cy: this.yLine(point.y),
  }));

  readonly scatter: ScatterPoint[] = [
    { x: 12, y: 42, r: 6 }, { x: 18, y: 51, r: 9 }, { x: 24, y: 48, r: 5 },
    { x: 31, y: 66, r: 11 }, { x: 38, y: 72, r: 7 }, { x: 44, y: 69, r: 8 },
    { x: 52, y: 88, r: 13 }, { x: 58, y: 91, r: 6 }, { x: 63, y: 84, r: 10 },
    { x: 71, y: 96, r: 8 }, { x: 78, y: 102, r: 12 }, { x: 84, y: 98, r: 7 },
  ];

  readonly scatterPoints = this.scatter.map((point) => ({
    ...point,
    cx: scaleLinear().domain([0, 90]).range([0, this.innerWidth])(point.x),
    cy: scaleLinear().domain([30, 110]).range([this.innerHeight, 0])(point.y),
  }));

  private readonly donutSource = [
    { name: 'Search', value: 1048 },
    { name: 'Direct', value: 735 },
    { name: 'Email', value: 580 },
    { name: 'Social', value: 484 },
  ];

  private readonly donutColors = ['#f59e0b', '#2563eb', '#14b8a6', '#8b5cf6'];

  private readonly pieGenerator = pie<{ name: string; value: number }>()
    .value((item) => item.value)
    .sort(null);

  private readonly arcGenerator = arc<PieArcDatum<{ name: string; value: number }>>()
    .innerRadius(54)
    .outerRadius(92);

  readonly donut = this.pieGenerator(this.donutSource).map((slice, index) => ({
    name: slice.data.name,
    d: this.arcGenerator(slice) ?? '',
    color: this.donutColors[index % this.donutColors.length],
  }));
}
