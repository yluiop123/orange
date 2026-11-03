import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card.component';
import { TranslatePipe } from '../../../core/translate.pipe';
import { barOption, gaugeOption, lineOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-dashboard-industrial',
  standalone: true,
  imports: [MatIconModule, TranslatePipe, StatCardComponent, EChartComponent, PageHeaderComponent],
  templateUrl: './dashboard-industrial.component.html',
  styleUrl: './dashboard-industrial.component.scss',
})
export class DashboardIndustrialComponent {
  readonly output = lineOption(
    ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    [
      { name: 'Units / h', data: [820, 940, 1010, 980, 1120, 1180, 1090, 1040], area: true },
      { name: 'Target', data: [900, 900, 1000, 1000, 1100, 1100, 1100, 1050] },
    ],
    false,
  );

  readonly oee = gaugeOption(86, 'OEE');

  readonly byLine = barOption(
    ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
    [
      { name: 'Output', data: [92, 88, 96, 74, 90, 84, 78, 95] },
      { name: 'Quality', data: [96, 94, 97, 88, 95, 92, 85, 98] },
    ],
  );

  readonly equipment = [
    { name: 'Extruder A1', line: 'L1', state: 'Running', temp: '184°C', vibration: '0.8 mm/s' },
    { name: 'Press B4', line: 'L2', state: 'Running', temp: '92°C', vibration: '1.4 mm/s' },
    { name: 'CNC C2', line: 'L3', state: 'Running', temp: '68°C', vibration: '0.5 mm/s' },
    { name: 'Robot D7', line: 'L4', state: 'Maintenance', temp: '41°C', vibration: '—' },
    { name: 'Packager E1', line: 'L5', state: 'Running', temp: '52°C', vibration: '0.6 mm/s' },
  ];
}
