import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EChartComponent } from '../../../shared/echart.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { StatCardComponent } from '../../../shared/stat-card.component';
import { TranslatePipe } from '../../../core/translate.pipe';
import { lineOption, pieOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-dashboard-normal',
  standalone: true,
  imports: [
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
    PageHeaderComponent,
    StatCardComponent,
    EChartComponent,
  ],
  templateUrl: './dashboard-normal.component.html',
  styleUrl: './dashboard-normal.component.scss',
})
export class DashboardNormalComponent {
  readonly traffic = lineOption(
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    [
      { name: 'Revenue', data: [42, 48, 51, 58, 63, 69, 74, 78, 84, 88, 92, 99], area: true },
      { name: 'Orders', data: [28, 31, 34, 36, 41, 45, 48, 52, 55, 58, 61, 66], area: true },
    ],
  );

  readonly sources = pieOption([
    { name: 'Direct', value: 42 },
    { name: 'Search', value: 28 },
    { name: 'Social', value: 18 },
    { name: 'Referral', value: 12 },
  ]);

  readonly activities = [
    { who: 'Olivia Martin', what: 'created order #10428', when: '2 min ago', icon: 'shopping_bag' },
    { who: 'Jackson Lee', what: 'upgraded to Enterprise', when: '18 min ago', icon: 'workspace_premium' },
    { who: 'Isabella Nguyen', what: 'invited 4 teammates', when: '1 hour ago', icon: 'group_add' },
    { who: 'William Kim', what: 'paid invoice INV-2291', when: '3 hours ago', icon: 'payments' },
    { who: 'Sofia Davis', what: 'opened a support ticket', when: '5 hours ago', icon: 'support_agent' },
  ];

  readonly goals = [
    { label: 'Monthly revenue', value: 78, hint: '$842K / $1.08M' },
    { label: 'New customers', value: 64, hint: '1,280 / 2,000' },
    { label: 'Retention', value: 92, hint: '92% / 95%' },
  ];
}
