import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { EChartsOption } from 'echarts';
import { EChartComponent } from '../../../shared/echart.component';
import { StatCardComponent } from '../../../shared/stat-card.component';
import { TranslatePipe } from '../../../core/translate.pipe';
import { radarOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-dashboard-military',
  standalone: true,
  imports: [MatIconModule, TranslatePipe, StatCardComponent, EChartComponent],
  templateUrl: './dashboard-military.component.html',
  styleUrl: './dashboard-military.component.scss',
})
export class DashboardMilitaryComponent {
  readonly situation: EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: 10, right: 10, top: 10, bottom: 10 },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'value', min: 0, max: 100, show: false },
    series: [
      {
        type: 'scatter',
        symbolSize: (value: unknown) => {
          const data = value as number[];
          return data[2] ?? 10;
        },
        itemStyle: { color: '#38bdf8', shadowBlur: 12, shadowColor: '#0ea5e9' },
        data: [
          [22, 68, 26, 'Alpha'], [38, 74, 18, 'Bravo'], [52, 61, 32, 'Charlie'],
          [68, 78, 20, 'Delta'], [76, 52, 24, 'Echo'], [41, 42, 16, 'Foxtrot'],
          [58, 33, 22, 'Golf'], [30, 26, 18, 'Hotel'], [84, 30, 14, 'India'],
          [17, 48, 14, 'Juliet'], [66, 20, 18, 'Kilo'],
        ],
      },
      {
        type: 'effectScatter',
        rippleEffect: { scale: 3, brushType: 'stroke' },
        symbolSize: 12,
        itemStyle: { color: '#f59e0b' },
        data: [[52, 61, 12, 'Command'], [22, 68, 12, 'Alpha']],
      },
    ],
  };

  readonly capabilities = radarOption(
    [
      { name: 'Mobility', max: 100 },
      { name: 'Firepower', max: 100 },
      { name: 'Intel', max: 100 },
      { name: 'Logistics', max: 100 },
      { name: 'Readiness', max: 100 },
      { name: 'Comms', max: 100 },
    ],
    [
      { name: 'Current', value: [82, 74, 88, 69, 91, 79] },
      { name: 'Target', value: [90, 85, 90, 80, 95, 88] },
    ],
    true,
  );

  readonly units = [
    { name: 'Alpha', type: 'Armor', status: 'Ready', strength: '98%', sector: 'N-12' },
    { name: 'Bravo', type: 'Infantry', status: 'Ready', strength: '94%', sector: 'N-14' },
    { name: 'Charlie', type: 'Signals', status: 'Deployed', strength: '88%', sector: 'E-03' },
    { name: 'Delta', type: 'Artillery', status: 'Ready', strength: '96%', sector: 'W-08' },
    { name: 'Echo', type: 'Recon', status: 'Engaged', strength: '72%', sector: 'S-21' },
  ];
}
