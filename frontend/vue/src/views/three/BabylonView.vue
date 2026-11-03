<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.three')
const el = ref<HTMLDivElement | null>(null)
let engine: Engine | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!el.value) return

  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.style.outline = 'none'
  el.value.appendChild(canvas)

  engine = new Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
  })
  engine.setHardwareScalingLevel(Math.min(1 / window.devicePixelRatio, 1))

  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.043, 0.055, 0.09, 1)

  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2.4,
    Math.PI / 2.8,
    5.2,
    new Vector3(0, 0.4, 0),
    scene,
  )
  camera.attachControl(engine.getRenderingCanvas(), true)
  camera.lowerRadiusLimit = 3
  camera.upperRadiusLimit = 9
  camera.wheelDeltaPercentage = 0.02

  const light = new HemisphericLight('light', new Vector3(0.4, 1, 0.2), scene)
  light.intensity = 0.9
  light.diffuse = new Color3(1, 0.85, 0.7)
  light.groundColor = new Color3(0.16, 0.22, 0.34)

  const material = new StandardMaterial('metal', scene)
  material.diffuseColor = new Color3(0.93, 0.35, 0.06)
  material.specularColor = new Color3(1, 0.92, 0.8)
  material.emissiveColor = new Color3(0.12, 0.04, 0.01)

  const knot = MeshBuilder.CreateTorusKnot(
    'knot',
    { radius: 0.9, tube: 0.3, radialSegments: 220, tubularSegments: 32 },
    scene,
  )
  knot.material = material
  knot.position.y = 0.4

  const core = MeshBuilder.CreateSphere('core', { diameter: 2.6, segments: 32 }, scene)
  const coreMaterial = new StandardMaterial('coreMat', scene)
  coreMaterial.wireframe = true
  coreMaterial.emissiveColor = new Color3(0.16, 0.62, 0.92)
  coreMaterial.alpha = 0.26
  core.material = coreMaterial
  core.position.y = 0.4

  const ring = MeshBuilder.CreateTorus('ring', { diameter: 4.2, thickness: 0.03, tessellation: 96 }, scene)
  const ringMaterial = new StandardMaterial('ringMat', scene)
  ringMaterial.emissiveColor = new Color3(0.98, 0.45, 0.12)
  ring.material = ringMaterial
  ring.position.y = -0.9

  scene.onBeforeRenderObservable.add(() => {
    const delta = engine ? engine.getDeltaTime() / 1000 : 0
    knot.rotation.y += delta * 0.6
    knot.rotation.x += delta * 0.24
    core.rotation.y -= delta * 0.18
    ring.rotation.y += delta * 0.3
  })

  engine.runRenderLoop(() => scene.render())

  observer = new ResizeObserver(() => engine?.resize())
  observer.observe(el.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  const canvas = engine?.getRenderingCanvas()
  engine?.dispose()
  canvas?.remove()
  engine = null
})
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.three.babylon')" />
    <div class="demo-3d">
      <div ref="el" class="babylon-canvas" />
      <v-card class="babylon-card" variant="flat">
        <div class="babylon-title">Babylon.js · ArcRotateCamera</div>
        <div class="babylon-note">Torus knot, wireframe core and orbital ring</div>
        <div class="babylon-tags">
          <v-chip size="x-small" variant="tonal" color="warning">StandardMaterial</v-chip>
          <v-chip size="x-small" variant="tonal" color="info">HemisphericLight</v-chip>
          <v-chip size="x-small" variant="tonal" color="success">WebGL2</v-chip>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.babylon-canvas {
  height: 100%;
  width: 100%;
}

.babylon-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}

.babylon-card {
  position: absolute;
  left: 16px;
  top: 16px;
  width: 320px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
  border: 1px solid rgba(251, 146, 60, 0.28);
}

.babylon-title {
  font-size: 13px;
  font-weight: 650;
  color: #fdba74;
}

.babylon-note {
  font-size: 11px;
  color: #94a3b8;
  margin: 6px 0 10px;
}

.babylon-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
