import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { TranslatePipe } from '../../../core/translate.pipe';

interface Site {
  name: string;
  coords: [number, number];
  kind: 'hq' | 'edge' | 'alert';
  detail: string;
}

const SITES: Site[] = [
  { name: 'Shanghai HQ', coords: [31.2304, 121.4737], kind: 'hq', detail: 'Primary operations centre' },
  { name: 'Suzhou edge', coords: [31.2989, 120.5853], kind: 'edge', detail: 'Edge node · 12 ms' },
  { name: 'Hangzhou edge', coords: [30.2741, 120.1551], kind: 'edge', detail: 'Edge node · 18 ms' },
  { name: 'Ningbo sensor', coords: [29.8683, 121.544], kind: 'alert', detail: 'Sensor cluster · degraded' },
  { name: 'Nanjing relay', coords: [32.0603, 118.7969], kind: 'edge', detail: 'Relay · 24 ms' },
];

@Component({
  selector: 'app-map-leaflet',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed">
      <div #host class="map-host"></div>
      <div class="map-overlay">
        <h2>{{ 'page.map.leaflet.title' | t }}</h2>
        <p>{{ 'page.map.leaflet.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="addRandomMarker()">
            <mat-icon>add_location_alt</mat-icon> Add marker
          </button>
          <button mat-stroked-button type="button" (click)="toggleRoutes()">
            <mat-icon>{{ routesVisible() ? 'visibility_off' : 'timeline' }}</mat-icon>
            {{ routesVisible() ? 'Hide routes' : 'Show routes' }}
          </button>
          <button mat-stroked-button type="button" (click)="resetView()">
            <mat-icon>center_focus_strong</mat-icon> Reset
          </button>
        </div>
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> HQ</div>
        <div class="legend-row"><span class="legend-dot" style="background:#3b82f6"></span> Edge</div>
        <div class="legend-row"><span class="legend-dot" style="background:#ef4444"></span> Alert</div>
      </div>
    </div>
  `,
  styles: [
    `
      .overlay-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
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
    `,
  ],
})
export class MapLeafletComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private routeLayer: L.LayerGroup | null = null;
  private counter = 0;
  readonly routesVisible = signal(true);

  ngAfterViewInit(): void {
    this.map = L.map(this.host().nativeElement, {
      center: [31.05, 120.6],
      zoom: 9,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);

    for (const site of SITES) {
      this.addSite(site);
    }

    L.circle([31.2304, 121.4737], {
      radius: 18000,
      color: '#f59e0b',
      weight: 1,
      fillColor: '#f59e0b',
      fillOpacity: 0.1,
    }).addTo(this.routeLayer);

    const hq = SITES[0].coords;
    for (const site of SITES.slice(1)) {
      L.polyline([hq, site.coords], {
        color: '#38bdf8',
        weight: 1.5,
        opacity: 0.6,
        dashArray: '6 8',
      }).addTo(this.routeLayer);
    }
  }

  private addSite(site: Site): void {
    if (!this.map || !this.markerLayer) return;
    const className = site.kind === 'hq' ? 'map-pin' : site.kind === 'alert' ? 'map-pin red' : 'map-pin blue';
    L.marker(site.coords, {
      icon: L.divIcon({ className: '', html: `<span class="${className}"></span>`, iconSize: [18, 18] }),
      title: site.name,
    })
      .bindPopup(`<strong>${site.name}</strong><br/>${site.detail}`)
      .addTo(this.markerLayer);
  }

  addRandomMarker(): void {
    if (!this.map) return;
    this.counter += 1;
    const center = this.map.getCenter();
    const coords: [number, number] = [
      center.lat + (Math.random() - 0.5) * 0.5,
      center.lng + (Math.random() - 0.5) * 0.5,
    ];
    this.addSite({
      name: `Field unit ${this.counter}`,
      coords,
      kind: 'edge',
      detail: 'Manually placed marker',
    });
  }

  toggleRoutes(): void {
    if (!this.map || !this.routeLayer) return;
    if (this.routesVisible()) {
      this.map.removeLayer(this.routeLayer);
      this.routesVisible.set(false);
    } else {
      this.routeLayer.addTo(this.map);
      this.routesVisible.set(true);
    }
  }

  resetView(): void {
    this.map?.setView([31.05, 120.6], 9);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }
}
