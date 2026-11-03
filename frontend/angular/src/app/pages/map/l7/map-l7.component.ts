import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { TranslatePipe } from '../../../core/translate.pipe';

const HUBS: { name: string; coords: [number, number]; value: number }[] = [
  { name: 'Shanghai', coords: [31.2304, 121.4737], value: 95 },
  { name: 'Suzhou', coords: [31.2989, 120.5853], value: 66 },
  { name: 'Hangzhou', coords: [30.2741, 120.1551], value: 74 },
  { name: 'Ningbo', coords: [29.8683, 121.544], value: 52 },
  { name: 'Nanjing', coords: [32.0603, 118.7969], value: 61 },
  { name: 'Hefei', coords: [31.8206, 117.2272], value: 38 },
];

@Component({
  selector: 'app-map-l7',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed l7-shell">
      <div #host class="map-host"></div>
      <div class="map-overlay">
        <h2>{{ 'page.map.l7.title' | t }}</h2>
        <p>{{ 'page.map.l7.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="toggleFlows()">
            <mat-icon>route</mat-icon>
            {{ flowsVisible() ? 'Hide flows' : 'Show flows' }}
          </button>
          <button mat-stroked-button type="button" (click)="resetView()">
            <mat-icon>center_focus_strong</mat-icon> Reset
          </button>
        </div>
        <p class="note">
          L7-style flow rendering. @antv/l7 needs a map-provider token, so this
          page uses Leaflet for the base map and animated SVG flow lines.
        </p>
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> Hub (size = volume)</div>
        <div class="legend-row"><span class="legend-dot" style="background:#38bdf8"></span> Flow</div>
      </div>
    </div>
  `,
  styles: [
    `
      .l7-shell {
        background: #030712;
      }
      .overlay-actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .overlay-actions button {
        font-size: 0.72rem;
      }
      .overlay-actions mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .note {
        margin: 8px 0 0 !important;
        font-size: 0.68rem;
        color: #64748b;
      }
    `,
  ],
})
export class MapL7Component implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map: L.Map | null = null;
  private flowLayer: L.LayerGroup | null = null;
  private hubLayer: L.LayerGroup | null = null;
  readonly flowsVisible = signal(true);

  ngAfterViewInit(): void {
    this.map = L.map(this.host().nativeElement, {
      center: [31.05, 120.4],
      zoom: 8,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(this.map);

    this.flowLayer = L.layerGroup().addTo(this.map);
    this.hubLayer = L.layerGroup().addTo(this.map);

    const hub = HUBS[0];
    for (const node of HUBS) {
      const size = 10 + node.value / 6;
      L.circle(node.coords, {
        radius: node.value * 650,
        color: '#f59e0b',
        weight: 1,
        opacity: 0.45,
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
      }).addTo(this.hubLayer);

      L.marker(node.coords, {
        icon: L.divIcon({
          className: '',
          html: `<span class="map-pin" style="width:${size}px;height:${size}px"></span>`,
          iconSize: [size, size],
        }),
        title: node.name,
      })
        .bindPopup(`<strong>${node.name}</strong><br/>Volume: ${node.value}`)
        .addTo(this.hubLayer);

      if (node !== hub) {
        L.polyline(curve(hub.coords, node.coords), {
          className: 'flow-line',
          color: '#38bdf8',
          weight: 2,
          opacity: 0.85,
          fill: false,
        }).addTo(this.flowLayer);
        L.polyline(curve(hub.coords, node.coords), {
          color: 'rgba(56, 189, 248, 0.16)',
          weight: 6,
          opacity: 0.5,
          fill: false,
        }).addTo(this.flowLayer);
      }
    }
  }

  toggleFlows(): void {
    if (!this.map || !this.flowLayer) return;
    if (this.flowsVisible()) {
      this.map.removeLayer(this.flowLayer);
      this.flowsVisible.set(false);
    } else {
      this.flowLayer.addTo(this.map);
      this.flowsVisible.set(true);
    }
  }

  resetView(): void {
    this.map?.setView([31.05, 120.4], 8);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }
}

/** Quadratic bezier between two coordinates, bent perpendicular to the line. */
function curve(from: [number, number], to: [number, number]): [number, number][] {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const control: [number, number] = [
    midLat + (to[1] - from[1]) * 0.16,
    midLng - (to[0] - from[0]) * 0.16,
  ];
  const points: [number, number][] = [];
  for (let index = 0; index <= 24; index += 1) {
    const t = index / 24;
    const lat =
      (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * control[0] + t * t * to[0];
    const lng =
      (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * control[1] + t * t * to[1];
    points.push([lat, lng]);
  }
  return points;
}
