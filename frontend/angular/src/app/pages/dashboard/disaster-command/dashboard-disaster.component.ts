import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card.component';
import { TranslatePipe } from '../../../core/translate.pipe';
import { barOption, lineOption, pieOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-dashboard-disaster',
  standalone: true,
  imports: [MatIconModule, TranslatePipe, StatCardComponent, EChartComponent, PageHeaderComponent],
  templateUrl: './dashboard-disaster.component.html',
  styleUrl: './dashboard-disaster.component.scss',
})
export class DashboardDisasterComponent {
  readonly severity = pieOption([
    { name: 'Critical', value: 4 },
    { name: 'High', value: 7 },
    { name: 'Medium', value: 9 },
    { name: 'Low', value: 4 },
  ]);

  readonly response = lineOption(
    ['06', '08', '10', '12', '14', '16', '18', '20'],
    [
      { name: 'Response (min)', data: [18, 15, 13, 16, 12, 11, 14, 10], area: true },
      { name: 'Resolved', data: [3, 5, 6, 4, 7, 8, 6, 9], area: true },
    ],
  );

  readonly resources = barOption(
    ['Medical', 'Food', 'Water', 'Shelter', 'Power'],
    [{ name: 'Allocated %', data: [82, 74, 91, 68, 57] }],
    true,
  );

  readonly timeline = [
    { time: '08:42', title: 'Flood warning upgraded to red', detail: 'River gauge 4.8 m, three districts affected.', tone: 'critical' },
    { time: '08:15', title: 'Shelter S-04 opened', detail: 'Capacity 320, medical team attached.', tone: 'normal' },
    { time: '07:58', title: 'Drone survey completed', detail: '12 km of levee inspected, one breach suspected.', tone: 'warn' },
    { time: '07:20', title: 'Evacuation route B closed', detail: 'Landslide debris; traffic rerouted to route C.', tone: 'warn' },
    { time: '06:45', title: 'Relief convoy departed', detail: '18 trucks with water, food and generators.', tone: 'normal' },
  ];
}
