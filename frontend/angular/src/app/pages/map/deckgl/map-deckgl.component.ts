import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Deck } from '@deck.gl/core';
import type { LayersList } from '@deck.gl/core';
import { ArcLayer, BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { TranslatePipe } from '../../../core/translate.pipe';

interface Node {
  name: string;
  coordinates: [number, number];
  weight: number;
}

const NODES: Node[] = [
  { name: 'Shanghai', coordinates: [121.4737, 31.2304], weight: 95 },
  { name: 'Suzhou', coordinates: [120.5853, 31.2989], weight: 66 },
  { name: 'Hangzhou', coordinates: [120.1551, 30.2741], weight: 74 },
  { name: 'Ningbo', coordinates: [121.544, 29.8683], weight: 52 },
  { name: 'Nanjing', coordinates: [118.7969, 32.0603], weight: 61 },
  { name: 'Hefei', coordinates: [117.2272, 31.8206], weight: 38 },
];

const ARCS = NODES.slice(1).map((node) => ({
  source: NODES[0],
  target: node,
}));

@Component({
  selector: 'app-map-deckgl',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed deck-shell">
      <div #host class="map-host"></div>
      <div class="map-overlay">
        <h2>{{ 'page.map.deckgl.title' | t }}</h2>
        <p>{{ 'page.map.deckgl.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="toggleArcs()">
            <mat-icon>route</mat-icon>
            {{ arcsVisible() ? 'Hide arcs' : 'Show arcs' }}
          </button>
          <button mat-stroked-button type="button" (click)="flyTo([121.4737, 31.2304], 11)">
            <mat-icon>location_city</mat-icon> Shanghai
          </button>
          <button mat-stroked-button type="button" (click)="flyTo([117.8, 31.2], 7)">
            <mat-icon>public</mat-icon> Region
          </button>
        </div>
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> Nodes</div>
        <div class="legend-row"><span class="legend-dot" style="background:#38bdf8"></span> Traffic arcs</div>
      </div>
    </div>
  `,
  styles: [
    `
      .deck-shell {
        background: #0b1220;
      }
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
export class MapDeckglComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private deck: Deck | null = null;
  readonly arcsVisible = signal(true);

  ngAfterViewInit(): void {
    this.deck = new Deck({
      parent: this.host().nativeElement,
      initialViewState: {
        longitude: 119.6,
        latitude: 31.1,
        zoom: 6.6,
        pitch: 38,
        bearing: -8,
      },
      controller: true,
      style: { position: 'absolute', top: '0', left: '0', width: '100%', height: '100%' },
      layers: this.buildLayers(),
      getTooltip: ({ object }: { object?: unknown }) => {
        const node = object as Node | undefined;
        return node?.name ? `${node.name} · ${node.weight}` : null;
      },
    });
  }

  private buildLayers(): LayersList {
    const layers: LayersList = [
      new TileLayer({
        id: 'osm-tiles',
        data: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
        renderSubLayers: (props: unknown) => {
          const tileProps = props as {
            data: unknown;
            tile: { boundingBox: [[number, number], [number, number]] };
          };
          const [[west, south], [east, north]] = tileProps.tile.boundingBox;
          return new BitmapLayer({
            ...(props as Record<string, unknown>),
            data: undefined,
            image: tileProps.data as string,
            bounds: [west, south, east, north],
          });
        },
      }),
      new ScatterplotLayer<Node>({
        id: 'nodes',
        data: NODES,
        getPosition: (node: Node) => node.coordinates,
        getRadius: (node: Node) => node.weight * 700,
        getFillColor: [245, 158, 11, 210],
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 1,
        stroked: true,
        pickable: true,
      }),
    ];

    if (this.arcsVisible()) {
      layers.push(
        new ArcLayer<{ source: Node; target: Node }>({
          id: 'arcs',
          data: ARCS,
          getSourcePosition: (arc) => arc.source.coordinates,
          getTargetPosition: (arc) => arc.target.coordinates,
          getSourceColor: [245, 158, 11, 220],
          getTargetColor: [56, 189, 248, 220],
          getWidth: 2,
          greatCircle: false,
        }),
      );
    }
    return layers;
  }

  toggleArcs(): void {
    this.arcsVisible.update((value) => !value);
    this.deck?.setProps({ layers: this.buildLayers() });
  }

  flyTo(center: [number, number], zoom: number): void {
    this.deck?.setProps({
      initialViewState: {
        longitude: center[0],
        latitude: center[1],
        zoom,
        pitch: 38,
        bearing: -8,
        transitionDuration: 600,
      },
    } as never);
  }

  ngOnDestroy(): void {
    this.deck?.finalize();
    this.deck = null;
  }
}
