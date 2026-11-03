import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EChartComponent } from '../../../shared/echart.component';
import { StatCardComponent } from '../../../shared/stat-card.component';
import { TranslatePipe } from '../../../core/translate.pipe';
import { gaugeOption, lineOption, pieOption } from '../../../shared/chart-presets';

@Component({
  selector: 'app-dashboard-network',
  standalone: true,
  imports: [MatIconModule, TranslatePipe, StatCardComponent, EChartComponent],
  templateUrl: './dashboard-network.component.html',
  styleUrl: './dashboard-network.component.scss',
})
export class DashboardNetworkComponent {
  readonly traffic = lineOption(
    ['00', '04', '08', '12', '16', '20', '24'],
    [
      { name: 'Ingress Gb/s', data: [12, 18, 26, 32, 41, 35, 22], area: true },
      { name: 'Blocked Gb/s', data: [3, 4, 6, 9, 14, 11, 5], area: true },
    ],
  );
  readonly severity = pieOption(
    [
      { name: 'Critical', value: 14 },
      { name: 'High', value: 38 },
      { name: 'Medium', value: 72 },
      { name: 'Low', value: 116 },
    ],
    true,
    true,
  );
  readonly risk = gaugeOption(72, 'Risk score', true);
  readonly alerts = [
    { level: 'critical', text: 'Repeated root SSH attempts', src: '10.24.8.11', time: '00:04:12' },
    { level: 'high', text: 'TLS certificate expires in 3 days', src: 'edge-gw-2', time: '00:11:47' },
    { level: 'high', text: 'Outbound spike to unknown ASN', src: 'app-node-7', time: '00:19:03' },
    { level: 'medium', text: 'WAF rule triggered 42 times', src: 'waf-prod', time: '00:26:31' },
    { level: 'low', text: 'Endpoint missing latest patch', src: 'win-042', time: '00:41:58' },
  ];
}
