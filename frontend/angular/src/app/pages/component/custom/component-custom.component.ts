import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../shared/page-header.component';

@Component({
  selector: 'app-component-custom',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page">
      <app-page-header titleKey="page.component.custom.title" descKey="page.component.custom.desc" />
      <div class="custom-grid">
        <section class="hero">
          <div class="hero-copy">
            <span class="eyebrow">ORANGE DESIGN SYSTEM</span>
            <h2>Composable admin surfaces</h2>
            <p>Brand cards, rings, timelines and status widgets built from theme tokens.</p>
            <div class="hero-actions">
              <button mat-flat-button type="button">Get started</button>
              <button mat-stroked-button type="button">Read docs</button>
            </div>
          </div>
          <div class="hero-art">
            <div class="ring">
              <span>86%</span>
              <small>OEE</small>
            </div>
          </div>
        </section>

        <section class="panel">
          <h2>KPI rings</h2>
          <div class="rings">
            @for (ring of rings; track ring.label) {
              <div class="kpi-ring" [style.background]="ring.gradient">
                <div class="inner">
                  <strong>{{ ring.value }}%</strong>
                  <small>{{ ring.label }}</small>
                </div>
              </div>
            }
          </div>
        </section>

        <section class="panel">
          <h2>Status widget</h2>
          <div class="status-list">
            @for (service of services; track service.name) {
              <div class="service">
                <span class="dot" [class.warn]="service.state === 'degraded'" [class.off]="service.state === 'down'"></span>
                <div class="service-main">
                  <strong>{{ service.name }}</strong>
                  <small>{{ service.detail }}</small>
                </div>
                <span class="state" [class.warn]="service.state === 'degraded'" [class.off]="service.state === 'down'">
                  {{ service.state }}
                </span>
              </div>
            }
          </div>
        </section>

        <section class="panel">
          <h2>Timeline</h2>
          <ol class="timeline">
            @for (event of events; track event.time) {
              <li>
                <span class="time mono">{{ event.time }}</span>
                <span class="marker" [style.background]="event.color"></span>
                <span class="event">
                  <strong>{{ event.title }}</strong>
                  <small>{{ event.detail }}</small>
                </span>
              </li>
            }
          </ol>
        </section>

        <section class="panel">
          <h2>Profile card</h2>
          <mat-card appearance="outlined" class="profile">
            <div class="cover"></div>
            <div class="profile-body">
              <span class="avatar">SM</span>
              <h3>Sarah Mitchell</h3>
              <p class="muted">Platform lead · Shanghai</p>
              <div class="stats">
                <div><strong>24</strong><small>Projects</small></div>
                <div><strong>8</strong><small>Teams</small></div>
                <div><strong>96%</strong><small>On time</small></div>
              </div>
              <mat-progress-bar mode="determinate" value="76" />
              <div class="profile-actions">
                <button mat-flat-button type="button">Message</button>
                <button mat-stroked-button type="button">Profile</button>
              </div>
            </div>
          </mat-card>
        </section>

        <section class="panel">
          <h2>Activity feed</h2>
          <ul class="feed">
            @for (item of feed; track item.when) {
              <li>
                <span class="feed-icon"><mat-icon>{{ item.icon }}</mat-icon></span>
                <span class="feed-text"><strong>{{ item.who }}</strong> {{ item.what }}</span>
                <span class="feed-when">{{ item.when }}</span>
              </li>
            }
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .hero {
        grid-column: span 3;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 30px 34px;
        border-radius: var(--app-radius);
        background:
          radial-gradient(600px 260px at 88% 20%, rgba(245, 158, 11, 0.4), transparent 60%),
          linear-gradient(120deg, #101827, #1c2638);
        color: #f8fafc;
      }
      .hero h2 {
        margin: 10px 0 8px;
        font-size: clamp(1.5rem, 2.4vw, 2.1rem);
      }
      .hero p {
        margin: 0 0 18px;
        color: #b6c0cf;
        max-width: 520px;
      }
      .eyebrow {
        font-size: 0.68rem;
        letter-spacing: 0.16em;
        color: #fbbf24;
      }
      .hero-actions {
        display: flex;
        gap: 10px;
      }
      .hero-art {
        flex: none;
      }
      .ring {
        display: grid;
        place-items: center;
        width: 150px;
        height: 150px;
        border-radius: 50%;
        background: conic-gradient(#f59e0b 0 86%, rgba(255, 255, 255, 0.12) 86% 100%);
      }
      .ring::before {
        content: '';
        position: absolute;
        width: 112px;
        height: 112px;
        border-radius: 50%;
        background: #101827;
      }
      .ring span,
      .ring small {
        position: relative;
        z-index: 1;
      }
      .ring span {
        font-size: 1.7rem;
        font-weight: 800;
        margin-top: -14px;
      }
      .ring small {
        font-size: 0.66rem;
        color: #94a3b8;
      }
      .rings {
        display: flex;
        gap: 18px;
        justify-content: space-around;
        flex-wrap: wrap;
        padding: 10px 0;
      }
      .kpi-ring {
        display: grid;
        place-items: center;
        width: 104px;
        height: 104px;
        border-radius: 50%;
      }
      .kpi-ring .inner {
        display: grid;
        place-items: center;
        width: 78px;
        height: 78px;
        border-radius: 50%;
        background: #fff;
      }
      .kpi-ring strong {
        font-size: 1.05rem;
      }
      .kpi-ring small {
        font-size: 0.62rem;
        color: #64748b;
      }
      .status-list {
        display: flex;
        flex-direction: column;
      }
      .service {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant, #eef0f2);
      }
      .service:last-child {
        border-bottom: 0;
      }
      .dot {
        width: 9px;
        height: 9px;
        flex: none;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.14);
      }
      .dot.warn {
        background: #f59e0b;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16);
      }
      .dot.off {
        background: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.14);
      }
      .service-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        font-size: 0.82rem;
      }
      .service-main small {
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.72rem;
      }
      .state {
        font-size: 0.66rem;
        color: #15803d;
        background: rgba(22, 163, 74, 0.1);
        padding: 2px 8px;
        border-radius: 999px;
      }
      .state.warn { color: #b45309; background: rgba(217, 119, 6, 0.12); }
      .state.off { color: #b91c1c; background: rgba(185, 28, 28, 0.1); }
      .timeline {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .timeline li {
        display: grid;
        grid-template-columns: 48px 12px 1fr;
        gap: 10px;
        padding: 8px 0;
      }
      .timeline .time {
        font-size: 0.7rem;
        color: var(--mat-sys-on-surface-variant, #5f6368);
        padding-top: 2px;
      }
      .timeline .marker {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-top: 4px;
      }
      .event {
        display: flex;
        flex-direction: column;
        font-size: 0.82rem;
      }
      .event small {
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.72rem;
      }
      .profile {
        overflow: hidden;
      }
      .cover {
        height: 64px;
        background: linear-gradient(120deg, #f59e0b, #ea580c);
      }
      .profile-body {
        padding: 0 16px 16px;
      }
      .profile .avatar {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        margin-top: -28px;
        border-radius: 50%;
        border: 4px solid #fff;
        background: #1f2937;
        color: #fff;
        font-weight: 700;
      }
      .profile h3 {
        margin: 8px 0 2px;
        font-size: 1rem;
      }
      .profile p {
        margin: 0 0 10px;
        font-size: 0.76rem;
      }
      .stats {
        display: flex;
        justify-content: space-between;
        margin: 10px 0;
        text-align: center;
      }
      .stats > div {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
      }
      .stats small {
        color: var(--mat-sys-on-surface-variant, #5f6368);
        font-size: 0.65rem;
      }
      .profile-actions {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }
      .feed {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .feed li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 0;
        border-bottom: 1px solid var(--mat-sys-outline-variant, #eef0f2);
        font-size: 0.8rem;
      }
      .feed li:last-child {
        border-bottom: 0;
      }
      .feed-icon {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        flex: none;
        border-radius: 8px;
        background: rgba(245, 158, 11, 0.12);
        color: #b45309;
      }
      .feed-icon mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .feed-text {
        flex: 1;
      }
      .feed-when {
        font-size: 0.68rem;
        color: var(--mat-sys-on-surface-variant, #5f6368);
        white-space: nowrap;
      }
      h2 {
        font-size: 0.95rem;
      }
      @media (max-width: 1000px) {
        .custom-grid { grid-template-columns: 1fr 1fr; }
        .hero { grid-column: span 2; }
      }
      @media (max-width: 680px) {
        .custom-grid { grid-template-columns: 1fr; }
        .hero { grid-column: span 1; flex-direction: column; align-items: flex-start; }
      }
    `,
  ],
})
export class ComponentCustomComponent {
  readonly rings = [
    { label: 'Quality', value: 92, gradient: 'conic-gradient(#22c55e 0 92%, #e2e8f0 92% 100%)' },
    { label: 'Speed', value: 74, gradient: 'conic-gradient(#2563eb 0 74%, #e2e8f0 74% 100%)' },
    { label: 'Uptime', value: 99, gradient: 'conic-gradient(#f59e0b 0 99%, #e2e8f0 99% 100%)' },
  ];

  readonly services = [
    { name: 'API gateway', detail: 'p95 84 ms · 3 regions', state: 'healthy' },
    { name: 'PostgreSQL', detail: 'replication lag 120 ms', state: 'degraded' },
    { name: 'Redis', detail: '2.1 GB / 8 GB', state: 'healthy' },
    { name: 'Ingest worker', detail: 'queue empty', state: 'healthy' },
    { name: 'Legacy exporter', detail: 'connection refused', state: 'down' },
  ];

  readonly events = [
    { time: '08:42', title: 'Release 2.18.0 deployed', detail: 'All health checks green.', color: '#22c55e' },
    { time: '08:20', title: 'Database failover', detail: 'Replica promoted in 12 seconds.', color: '#f59e0b' },
    { time: '07:55', title: 'Certificate rotated', detail: 'edge-gw-2 now valid for 90 days.', color: '#2563eb' },
    { time: '07:10', title: 'Incident resolved', detail: 'Elevated latency in APAC.', color: '#22c55e' },
  ];

  readonly feed = [
    { who: 'Olivia', what: 'approved the access request', when: '2m', icon: 'check_circle' },
    { who: 'Liam', what: 'added a new role', when: '18m', icon: 'badge' },
    { who: 'Emma', what: 'exported the audit log', when: '1h', icon: 'download' },
    { who: 'Noah', what: 'updated the retention policy', when: '3h', icon: 'tune' },
  ];
}
