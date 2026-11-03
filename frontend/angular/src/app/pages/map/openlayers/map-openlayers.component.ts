import { AfterViewInit, Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import { TranslatePipe } from '../../../core/translate.pipe';
import { NotificationService } from '../../../core/notification.service';
import { I18nService } from '../../../core/i18n.service';

const CITIES = [
  { name: 'Shanghai', lon: 121.4737, lat: 31.2304 },
  { name: 'Suzhou', lon: 120.5853, lat: 31.2989 },
  { name: 'Hangzhou', lon: 120.1551, lat: 30.2741 },
  { name: 'Ningbo', lon: 121.544, lat: 29.8683 },
  { name: 'Nanjing', lon: 118.7969, lat: 32.0603 },
];

@Component({
  selector: 'app-map-openlayers',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed">
      <div #host class="map-host"></div>
      <div class="map-overlay">
        <h2>{{ 'page.map.openlayers.title' | t }}</h2>
        <p>{{ 'page.map.openlayers.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="toggleDraw()">
            <mat-icon>{{ drawing() ? 'close' : 'polyline' }}</mat-icon>
            {{ drawing() ? 'Stop drawing' : 'Draw area' }}
          </button>
          <button mat-stroked-button type="button" (click)="clearDrawings()">
            <mat-icon>delete_sweep</mat-icon> Clear
          </button>
        </div>
        <p class="coords mono">{{ coords() }}</p>
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> OpenLayers vector</div>
        <div class="legend-row"><span class="legend-dot" style="background:#38bdf8"></span> Drawn geometry</div>
      </div>
    </div>
  `,
  styles: [
    `
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
      .coords {
        margin: 8px 0 0 !important;
        font-size: 0.68rem;
        color: #475569;
      }
    `,
  ],
})
export class MapOpenlayersComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly notify = inject(NotificationService);
  private readonly i18n = inject(I18nService);

  private map: OlMap | null = null;
  private draw: Draw | null = null;
  private readonly drawSource = new VectorSource();
  readonly drawing = signal(false);
  readonly coords = signal('121.4737, 31.2304');

  ngAfterViewInit(): void {
    const siteSource = new VectorSource();

    for (const city of CITIES) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([city.lon, city.lat])),
        name: city.name,
      });
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: '#f59e0b' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: new Text({
            text: city.name,
            offsetY: -16,
            font: '11px Roboto, sans-serif',
            fill: new Fill({ color: '#0f172a' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
          }),
        }),
      );
      siteSource.addFeature(feature);
    }

    siteSource.addFeature(
      new Feature({
        geometry: new LineString(
          CITIES.map((city) => fromLonLat([city.lon, city.lat])),
        ),
      }),
    );

    this.map = new OlMap({
      target: this.host().nativeElement,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({
          source: siteSource,
          style: new Style({ stroke: new Stroke({ color: '#38bdf8', width: 1.5, lineDash: [6, 8] }) }),
        }),
        new VectorLayer({
          source: this.drawSource,
          style: new Style({
            fill: new Fill({ color: 'rgba(56, 189, 248, 0.18)' }),
            stroke: new Stroke({ color: '#0ea5e9', width: 2 }),
          }),
        }),
      ],
      view: new View({
        center: fromLonLat([120.6, 31.05]),
        zoom: 8,
      }),
    });

    this.map.on('pointermove', (event) => {
      const [lon, lat] = event.coordinate;
      this.coords.set(`${lon.toFixed(4)}, ${lat.toFixed(4)}`);
    });
  }

  toggleDraw(): void {
    if (!this.map) return;
    if (this.draw) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
      this.drawing.set(false);
      return;
    }
    this.draw = new Draw({ source: this.drawSource, type: 'Polygon' });
    this.draw.on('drawend', () => {
      this.notify.success(this.i18n.t('message.success'));
    });
    this.map.addInteraction(this.draw);
    this.drawing.set(true);
  }

  clearDrawings(): void {
    this.drawSource.clear();
  }

  ngOnDestroy(): void {
    this.map?.setTarget(undefined);
    this.map = null;
  }
}
