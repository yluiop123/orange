<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.three')
const el = ref<HTMLDivElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let observer: ResizeObserver | null = null
let frame = 0

onMounted(() => {
  if (!el.value) return

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0b1020')
  scene.fog = new THREE.Fog('#0b1020', 8, 22)

  const camera = new THREE.PerspectiveCamera(48, el.value.clientWidth / el.value.clientHeight, 0.1, 100)
  camera.position.set(0, 1.1, 5.4)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(el.value.clientWidth, el.value.clientHeight)
  el.value.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.6
  controls.enablePan = false
  controls.minDistance = 3
  controls.maxDistance = 9

  scene.add(new THREE.AmbientLight('#94a3b8', 1.1))
  const key = new THREE.DirectionalLight('#ffffff', 2.4)
  key.position.set(4, 6, 5)
  scene.add(key)
  const rim = new THREE.PointLight('#f97316', 40, 20)
  rim.position.set(-4, 2, 3)
  scene.add(rim)
  const fill = new THREE.PointLight('#38bdf8', 26, 20)
  fill.position.set(3, -2, -3)
  scene.add(fill)

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.05, 0.33, 220, 32),
    new THREE.MeshStandardMaterial({
      color: '#f97316',
      metalness: 0.92,
      roughness: 0.18,
      emissive: '#7c2d12',
      emissiveIntensity: 0.25,
    }),
  )
  scene.add(knot)

  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.05, 1),
    new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true, transparent: true, opacity: 0.18 }),
  )
  scene.add(cage)

  const grid = new THREE.GridHelper(18, 36, '#1e293b', '#111827')
  grid.position.y = -2.1
  scene.add(grid)

  const count = 900
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 26
    positions[index * 3 + 1] = (Math.random() - 0.5) * 14
    positions[index * 3 + 2] = (Math.random() - 0.5) * 26
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: '#7dd3fc', size: 0.035, transparent: true, opacity: 0.7 }),
  )
  scene.add(stars)

  observer = new ResizeObserver(() => {
    if (!el.value || !renderer) return
    camera.aspect = el.value.clientWidth / el.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(el.value.clientWidth, el.value.clientHeight)
  })
  observer.observe(el.value)

  const clock = new THREE.Timer()
  const animate = () => {
    frame = requestAnimationFrame(animate)
    clock.update()
    const elapsed = clock.getElapsed()
    knot.rotation.x = elapsed * 0.32
    knot.rotation.y = elapsed * 0.46
    cage.rotation.y = -elapsed * 0.12
    stars.rotation.y = elapsed * 0.02
    controls.update()
    renderer?.render(scene, camera)
  }
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  observer = null
  renderer?.dispose()
  renderer?.domElement.remove()
  renderer = null
})
</script>

<template>
  <div class="orange-page">
    <PageHeader :title="title" :subtitle="t('page.three.three')" />
    <div class="orange-3d">
      <div ref="el" class="three-canvas" />
      <v-card class="three-card" variant="flat">
        <div class="three-title">Three.js · WebGLRenderer</div>
        <div class="three-note">Auto-rotating torus knot · orbit controls · 900 particles</div>
        <div class="three-tags">
          <v-chip size="x-small" variant="tonal" color="primary">MeshStandardMaterial</v-chip>
          <v-chip size="x-small" variant="tonal" color="info">OrbitControls</v-chip>
          <v-chip size="x-small" variant="tonal" color="success">60 fps</v-chip>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.three-canvas {
  height: 100%;
  width: 100%;
}

.three-canvas :deep(canvas) {
  display: block;
}

.three-card {
  position: absolute;
  left: 16px;
  top: 16px;
  width: 320px;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
  border: 1px solid rgba(56, 189, 248, 0.24);
}

.three-title {
  font-size: 13px;
  font-weight: 650;
  color: #fdba74;
}

.three-note {
  font-size: 11px;
  color: #94a3b8;
  margin: 6px 0 10px;
}

.three-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
