import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card.component';
import { TranslatePipe } from '../../../core/translate.pipe';
import { barOption, lineOption, pieOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-dashboard-agriculture',
  standalone: true,
  imports: [MatIconModule, TranslatePipe, StatCardComponent, EChartComponent, PageHeaderComponent],
  templateUrl: './dashboard-agriculture.component.html',
  styleUrl: './dashboard-agriculture.component.scss',
})
export class DashboardAgricultureComponent {
  readonly harvest = lineOption(
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    [
      { name: 'Wheat (t)', data: [120, 138, 155, 172, 198, 224, 260, 288, 310, 342], area: true },
      { name: 'Corn (t)', data: [90, 104, 118, 136, 158, 182, 210, 238, 265, 290], area: true },
    ],
  );

  readonly rainfall = barOption(
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    [{ name: 'Rainfall (mm)', data: [42, 38, 56, 74, 98, 132, 156, 142, 108, 66] }],
  );

  readonly crops = pieOption([
    { name: 'Wheat', value: 42 },
    { name: 'Corn', value: 28 },
    { name: 'Soy', value: 18 },
    { name: 'Orchard', value: 12 },
  ]);

  readonly fields = [
    { name: 'North Ridge', crop: 'Wheat', area: '320 ha', moisture: '62%', status: 'Healthy' },
    { name: 'Willow Flats', crop: 'Corn', area: '280 ha', moisture: '48%', status: 'Irrigating' },
    { name: 'Sunny Acres', crop: 'Soy', area: '190 ha', moisture: '55%', status: 'Healthy' },
    { name: 'Cedar Orchard', crop: 'Apples', area: '120 ha', moisture: '71%', status: 'Monitoring' },
    { name: 'East Terrace', crop: 'Wheat', area: '330 ha', moisture: '39%', status: 'Dry' },
  ];
}
