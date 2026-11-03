import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TranslatePipe } from '../../../core/translate.pipe';

@Component({
  selector: 'app-three-scene',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="full-bleed three-shell">
      <div #host class="three-host"></div>
      <div class="map-overlay">
        <h2>{{ 'page.three.three.title' | t }}</h2>
        <p>{{ 'page.three.three.desc' | t }}</p>
        <div class="overlay-actions">
          <button mat-stroked-button type="button" (click)="toggleSpin()">
            <mat-icon>rotate_right</mat-icon> {{ spinning() ? 'Stop' : 'Spin' }}
          </button>
          <button mat-stroked-button type="button" (click)="toggleWireframe()">
            <mat-icon>grid_4x4</mat-icon> Wireframe
          </button>
          <button mat-stroked-button type="button" (click)="resetCamera()">
            <mat-icon>video_camera_front</mat-icon> Reset
          </button>
        </div>
      </div>
      <div class="map-legend">
        <div class="legend-row"><span class="legend-dot" style="background:#f59e0b"></span> Torus knot</div>
        <div class="legend-row"><span class="legend-dot" style="background:#38bdf8"></span> Orbit satellites</div>
      </div>
    </div>
  `,
  styles: [
    `
      .three-shell {
        background: radial-gradient(circle at 50% 45%, #14213d, #030712 72%);
      }
      .three-host {
        position: absolute;
        inset: 0;
      }
      .three-host canvas {
        display: block;
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
export class ThreeSceneComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private knot: THREE.Mesh<THREE.TorusKnotGeometry, THREE.MeshStandardMaterial> | null = null;
  private satellites: THREE.Mesh[] = [];
  private frame = 0;
  private resizeObserver: ResizeObserver | null = null;

  readonly spinning = signal(true);

  ngAfterViewInit(): void {
    const element = this.host().nativeElement;
    const width = element.clientWidth || 800;
    const height = element.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    element.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030712, 0.028);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 220);
    this.camera.position.set(6.4, 4.2, 8.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 26;

    const ambient = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 1.15);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 3.4);
    key.position.set(6, 9, 5);
    this.scene.add(key);

    const rim = new THREE.PointLight(0xf59e0b, 42, 40);
    rim.position.set(-5, 2.5, -4);
    this.scene.add(rim);

    const grid = new THREE.GridHelper(22, 22, 0x1e3a5f, 0x14213d);
    grid.position.y = -2.6;
    this.scene.add(grid);

    this.knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.55, 0.48, 180, 26),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.82,
        roughness: 0.22,
        emissive: 0x3b1d02,
        emissiveIntensity: 0.55,
      }),
    );
    this.scene.add(this.knot);

    const geometry = new THREE.SphereGeometry(0.12, 16, 16);
    for (let index = 0; index < 18; index += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: index % 3 === 0 ? 0x38bdf8 : 0x94a3b8,
        emissive: 0x1d4ed8,
        emissiveIntensity: index % 3 === 0 ? 0.9 : 0.2,
        metalness: 0.6,
        roughness: 0.3,
      });
      const satellite = new THREE.Mesh(geometry, material);
      this.satellites.push(satellite);
      this.scene.add(satellite);
    }

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(element);
    this.animate();
  }

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const element = this.host().nativeElement;
    const width = element.clientWidth;
    const height = element.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate = (): void => {
    this.frame = requestAnimationFrame(this.animate);
    const time = performance.now() / 1000;

    if (this.knot && this.spinning()) {
      this.knot.rotation.x = time * 0.35;
      this.knot.rotation.y = time * 0.52;
    }

    this.satellites.forEach((satellite, index) => {
      const angle = time * 0.32 + (index / this.satellites.length) * Math.PI * 2;
      const radius = 3.2 + (index % 5) * 0.32;
      satellite.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 1.7) * 1.15,
        Math.sin(angle) * radius,
      );
    });

    this.controls?.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  toggleSpin(): void {
    this.spinning.update((value) => !value);
  }

  toggleWireframe(): void {
    if (!this.knot) return;
    this.knot.material.wireframe = !this.knot.material.wireframe;
  }

  resetCamera(): void {
    this.controls?.reset();
    this.camera?.position.set(6.4, 4.2, 8.2);
    this.controls?.update();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.knot?.geometry.dispose();
    this.knot?.material.dispose();
    for (const satellite of this.satellites) {
      (satellite.material as THREE.Material).dispose();
    }
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.renderer = null;
  }
}
