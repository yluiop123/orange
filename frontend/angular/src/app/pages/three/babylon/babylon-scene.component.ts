import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ArcRotateCamera,
  Color3,
  Engine,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { TranslatePipe } from '../../../core/translate.pipe';

@Component({
  selector: 'app-babylon-scene',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed babylon-shell">
      <canvas #canvas class="scene-canvas"></canvas>
      <div class="map-overlay">
        <h2>{{ 'page.three.babylon.title' | t }}</h2>
        <p>{{ 'page.three.babylon.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="toggleSpin()">
            <mat-icon>rotate_right</mat-icon> {{ spinning() ? 'Stop' : 'Spin' }}
          </button>
          <button mat-stroked-button type="button" (click)="cycleColor()">
            <mat-icon>palette</mat-icon> Color
          </button>
          <button mat-stroked-button type="button" (click)="resetCamera()">
            <mat-icon>video_camera_front</mat-icon> Reset
          </button>
        </div>
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> Babylon knot</div>
        <div class="legend-row"><span class="legend-dot" style="background:#38bdf8"></span> Glow layer</div>
      </div>
    </div>
  `,
  styles: [
    `
      .babylon-shell {
        background: radial-gradient(circle at 55% 40%, #0d1b33, #030712 74%);
      }
      .scene-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        outline: none;
        touch-action: none;
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
    `,
  ],
})
export class BabylonSceneComponent implements AfterViewInit, OnDestroy {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private knot: Mesh | null = null;
  private material: StandardMaterial | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private colorIndex = 0;
  private readonly colors = [new Color3(0.96, 0.62, 0.04), new Color3(0.22, 0.74, 0.97), new Color3(0.55, 0.36, 0.96)];

  readonly spinning = signal(true);

  ngAfterViewInit(): void {
    const canvas = this.canvas().nativeElement;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color3(0.012, 0.027, 0.071).toColor4();

    this.camera = new ArcRotateCamera('camera', -Math.PI / 2.2, Math.PI / 2.7, 9, Vector3.Zero(), this.scene);
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 4;
    this.camera.upperRadiusLimit = 24;
    this.camera.wheelDeltaPercentage = 0.02;

    const light = new HemisphericLight('light', new Vector3(0.4, 1, 0.2), this.scene);
    light.intensity = 1.1;
    light.groundColor = new Color3(0.08, 0.12, 0.22);

    const glow = new GlowLayer('glow', this.scene);
    glow.intensity = 0.7;

    this.material = new StandardMaterial('knot-material', this.scene);
    this.material.diffuseColor = this.colors[0];
    this.material.emissiveColor = this.colors[0].scale(0.35);
    this.material.specularPower = 96;

    this.knot = MeshBuilder.CreateTorusKnot(
      'knot',
      { radius: 1.55, tube: 0.46, radialSegments: 160, tubularSegments: 28 },
      this.scene,
    );
    this.knot.material = this.material;

    const ground = MeshBuilder.CreateGround('ground', { width: 26, height: 26 }, this.scene);
    ground.position.y = -2.6;
    const groundMaterial = new StandardMaterial('ground-material', this.scene);
    groundMaterial.diffuseColor = new Color3(0.03, 0.06, 0.12);
    groundMaterial.emissiveColor = new Color3(0.01, 0.03, 0.07);
    ground.material = groundMaterial;

    const satelliteMaterial = new StandardMaterial('satellite-material', this.scene);
    satelliteMaterial.emissiveColor = new Color3(0.22, 0.74, 0.97);

    for (let index = 0; index < 16; index += 1) {
      const satellite = MeshBuilder.CreateSphere(`satellite-${index}`, { diameter: 0.2 }, this.scene);
      satellite.material = satelliteMaterial;
      satellite.metadata = { phase: (index / 16) * Math.PI * 2, radius: 3.2 + (index % 4) * 0.32 };
    }

    let elapsed = 0;
    this.scene.onBeforeRenderObservable.add(() => {
      const delta = this.engine ? this.engine.getDeltaTime() / 1000 : 0;
      if (this.spinning() && this.knot) {
        this.knot.rotation.y += delta * 0.55;
        this.knot.rotation.x += delta * 0.18;
      }
      elapsed += delta;
      if (this.scene) {
        for (const mesh of this.scene.meshes) {
          const meta = mesh.metadata as { phase: number; radius: number } | null;
          if (!meta || !('phase' in meta)) continue;
          const angle = elapsed * 0.45 + meta.phase;
          mesh.position.set(
            Math.cos(angle) * meta.radius,
            Math.sin(angle * 1.4) * 1.2,
            Math.sin(angle) * meta.radius,
          );
        }
      }
    });

    this.engine.runRenderLoop(() => this.scene?.render());

    this.resizeObserver = new ResizeObserver(() => this.engine?.resize());
    this.resizeObserver.observe(canvas);
  }

  toggleSpin(): void {
    this.spinning.update((value) => !value);
  }

  cycleColor(): void {
    if (!this.material) return;
    this.colorIndex = (this.colorIndex + 1) % this.colors.length;
    const color = this.colors[this.colorIndex];
    this.material.diffuseColor = color;
    this.material.emissiveColor = color.scale(0.35);
  }

  resetCamera(): void {
    this.camera?.setPosition(new Vector3(0, 4, -9));
    this.camera?.setTarget(Vector3.Zero());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
  }
}
