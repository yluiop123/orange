import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../../core/translate.pipe';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Cesium?: any;
    CESIUM_BASE_URL?: string;
  }
}

const CESIUM_VERSION = '1.147';
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;

@Component({
  selector: 'app-map-cesium',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed cesium-shell">
      <div #host class="map-host cesium-host"></div>

      @if (fallback()) {
        <div class="fallback">
          <div class="globe">
            <div class="orbit"></div>
          </div>
          <p>The Cesium runtime could not be loaded (it is fetched from the Cesium CDN).</p>
          <p class="muted">Showing a static fallback scene instead.</p>
        </div>
      }

      <div class="map-overlay">
        <h2>{{ 'page.map.cesium.title' | t }}</h2>
        <p>{{ 'page.map.cesium.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="flyToShanghai()">
            <mat-icon>flight_takeoff</mat-icon> Fly to Shanghai
          </button>
          <button mat-stroked-button type="button" (click)="toggleSpin()">
            <mat-icon>sync</mat-icon> {{ spinning() ? 'Stop spin' : 'Spin globe' }}
          </button>
        </div>
        @if (status()) {
          <p class="status">{{ status() }}</p>
        }
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> Cesium entity</div>
        <div class="legend-row"><span class="legend-dot" style="background:#38bdf8"></span> Camera flight</div>
      </div>
    </div>
  `,
  styles: [
    `
      .cesium-shell {
        background: radial-gradient(circle at 50% 40%, #12233f, #030712 70%);
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
      .status {
        margin: 8px 0 0 !important;
        font-size: 0.7rem;
        color: #475569;
      }
      .fallback {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #cbd5e1;
        text-align: center;
        padding: 20px;
      }
      .fallback p {
        margin: 0;
        font-size: 0.82rem;
      }
      .globe {
        position: relative;
        width: 220px;
        height: 220px;
        margin-bottom: 18px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 32% 28%, rgba(56, 189, 248, 0.6), transparent 45%),
          radial-gradient(circle at 70% 72%, rgba(245, 158, 11, 0.4), transparent 45%),
          #0b2544;
        box-shadow: inset -30px -20px 60px rgba(0, 0, 0, 0.65), 0 0 80px rgba(56, 189, 248, 0.22);
      }
      .orbit {
        position: absolute;
        inset: -18px;
        border: 1px dashed rgba(148, 163, 184, 0.45);
        border-radius: 50%;
        transform: rotate(-18deg);
        animation: spin 18s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(342deg); }
      }
    `,
  ],
})
export class MapCesiumComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private viewer: any = null;
  private rotationTimer: number | null = null;

  readonly fallback = signal(false);
  readonly spinning = signal(false);
  readonly status = signal('Requesting Cesium runtime from the CDN…');

  async ngAfterViewInit(): Promise<void> {
    try {
      const Cesium = await loadCesium();
      if (!Cesium) {
        this.fail();
        return;
      }
      this.viewer = new Cesium.Viewer(this.host().nativeElement, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        shouldAnimate: true,
      });

      this.viewer.imageryLayers.removeAll();
      this.viewer.imageryLayers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        }),
      );

      const position = Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 1200);
      this.viewer.entities.add({
        position,
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#f59e0b'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
        },
        label: {
          text: 'Shanghai HQ',
          font: '600 14px Roboto, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -28),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
      });

      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(121.47, 31.23, 1400000),
        duration: 2,
      });
      this.status.set('Cesium 1.147 · OpenStreetMap imagery');
    } catch {
      this.fail();
    }
  }

  private fail(): void {
    this.fallback.set(true);
    this.status.set('Offline fallback');
  }

  flyToShanghai(): void {
    if (!this.viewer || !window.Cesium) return;
    this.viewer.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 60000),
      duration: 1.6,
    });
  }

  toggleSpin(): void {
    if (!this.viewer || !window.Cesium) return;
    if (this.rotationTimer !== null) {
      window.clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      this.spinning.set(false);
      return;
    }
    this.spinning.set(true);
    this.rotationTimer = window.setInterval(() => {
      if (!this.viewer) return;
      this.viewer.camera.rotate(window.Cesium.Cartesian3.UNIT_Z, 0.002);
    }, 30);
  }

  ngOnDestroy(): void {
    if (this.rotationTimer !== null) window.clearInterval(this.rotationTimer);
    this.viewer?.destroy();
    this.viewer = null;
  }
}

function loadCesium(): Promise<any> {
  if (window.Cesium) return Promise.resolve(window.Cesium);
  window.CESIUM_BASE_URL = CESIUM_BASE;

  if (!document.getElementById('cesium-widgets')) {
    const link = document.createElement('link');
    link.id = 'cesium-widgets';
    link.rel = 'stylesheet';
    link.href = `${CESIUM_BASE}Widgets/widgets.css`;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('cesium-runtime') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cesium));
      existing.addEventListener('error', () => reject(new Error('Cesium load failed')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'cesium-runtime';
    script.src = `${CESIUM_BASE}Cesium.js`;
    script.async = true;
    script.onload = () => resolve(window.Cesium);
    script.onerror = () => reject(new Error('Cesium load failed'));
    document.body.appendChild(script);
  });
}
