import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authToken } from '@/auth/token'
import { createAccess } from '@/lib/access'
import { isSamePath } from '@/lib/path'
import { pinia } from '@/stores/pinia'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'

export const CONTAINER_PATHS = ['/dashboard', '/chart', '/map', '/three', '/component', '/system']

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/errors/ForbiddenView.vue'),
    meta: { public: true },
  },
  {
    path: '/swagger',
    name: 'swagger',
    component: () => import('@/views/SwaggerView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/views/MenuRedirect.vue') },
      ...CONTAINER_PATHS.map<RouteRecordRaw>((path) => ({
        path: path.slice(1),
        name: `container:${path}`,
        component: () => import('@/views/MenuRedirect.vue'),
        props: { nodePath: path },
      })),
      {
        path: 'system/user',
        name: 'system-user',
        component: () => import('@/views/system/UserView.vue'),
      },
      {
        path: 'system/role',
        name: 'system-role',
        component: () => import('@/views/system/RoleView.vue'),
      },
      {
        path: 'system/group',
        name: 'system-group',
        component: () => import('@/views/system/GroupView.vue'),
      },
      {
        path: 'system/permission',
        name: 'system-permission',
        component: () => import('@/views/system/PermissionView.vue'),
      },
      {
        path: 'system/operation-log',
        name: 'system-operation-log',
        component: () => import('@/views/system/OperationLogView.vue'),
      },
      {
        path: 'dashboard/normal',
        name: 'dashboard-normal',
        component: () => import('@/views/dashboard/NormalView.vue'),
      },
      {
        path: 'dashboard/network-security',
        name: 'dashboard-network-security',
        component: () => import('@/views/dashboard/NetworkSecurityView.vue'),
      },
      {
        path: 'dashboard/military-situational-awareness',
        name: 'dashboard-military',
        component: () => import('@/views/dashboard/MilitaryView.vue'),
      },
      {
        path: 'dashboard/disaster-command',
        name: 'dashboard-disaster',
        component: () => import('@/views/dashboard/DisasterView.vue'),
      },
      {
        path: 'dashboard/agriculture-forestry',
        name: 'dashboard-agriculture',
        component: () => import('@/views/dashboard/AgricultureView.vue'),
      },
      {
        path: 'dashboard/industrial',
        name: 'dashboard-industrial',
        component: () => import('@/views/dashboard/IndustrialView.vue'),
      },
      { path: 'chart/antv', name: 'chart-antv', component: () => import('@/views/chart/AntvView.vue') },
      { path: 'chart/d3', name: 'chart-d3', component: () => import('@/views/chart/D3View.vue') },
      {
        path: 'chart/echart',
        name: 'chart-echart',
        component: () => import('@/views/chart/EchartView.vue'),
      },
      {
        path: 'chart/rechart',
        name: 'chart-rechart',
        component: () => import('@/views/chart/RechartView.vue'),
      },
      {
        path: 'map/cesium',
        name: 'map-cesium',
        component: () => import('@/views/map/CesiumView.vue'),
      },
      {
        path: 'map/deckgl',
        name: 'map-deckgl',
        component: () => import('@/views/map/DeckglView.vue'),
      },
      { path: 'map/l7', name: 'map-l7', component: () => import('@/views/map/L7View.vue') },
      {
        path: 'map/leaflet',
        name: 'map-leaflet',
        component: () => import('@/views/map/LeafletView.vue'),
      },
      {
        path: 'map/openlayers',
        name: 'map-openlayers',
        component: () => import('@/views/map/OpenlayersView.vue'),
      },
      { path: 'three/three', name: 'three-three', component: () => import('@/views/three/ThreeView.vue') },
      {
        path: 'three/babylon',
        name: 'three-babylon',
        component: () => import('@/views/three/BabylonView.vue'),
      },
      {
        path: 'component/general',
        name: 'component-general',
        component: () => import('@/views/component/GeneralView.vue'),
      },
      {
        path: 'component/layout',
        name: 'component-layout',
        component: () => import('@/views/component/LayoutView.vue'),
      },
      {
        path: 'component/navigation',
        name: 'component-navigation',
        component: () => import('@/views/component/NavigationView.vue'),
      },
      {
        path: 'component/table',
        name: 'component-table',
        component: () => import('@/views/component/TableView.vue'),
      },
      {
        path: 'component/form',
        name: 'component-form',
        component: () => import('@/views/component/FormView.vue'),
      },
      {
        path: 'component/display',
        name: 'component-display',
        component: () => import('@/views/component/DisplayView.vue'),
      },
      {
        path: 'component/feedback',
        name: 'component-feedback',
        component: () => import('@/views/component/FeedbackView.vue'),
      },
      {
        path: 'component/custom',
        name: 'component-custom',
        component: () => import('@/views/component/CustomView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  const menu = useMenuStore(pinia)

  if (to.meta.public) {
    if (to.path === '/login' && authToken.get()) return { path: '/' }
    return true
  }

  if (!authToken.get()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!auth.userInfo) {
    const user = await auth.fetchUser()
    if (!user) return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!menu.loaded) {
    await menu.fetchMenus()
  }

  const isHome = to.path === '/'
  const isContainer = CONTAINER_PATHS.some((path) => isSamePath(path, to.path))
  if (isHome || isContainer) return true

  if (auth.mustChangePassword) return true

  const access = createAccess(auth.currentPermissions)
  if (!access.canView(to.path)) {
    if (menu.loaded) {
      const target = access.firstVisibleLeaf(menu.menus)
      if (target && isSamePath(target, to.path)) return true
    }
    return { path: '/forbidden', query: { from: to.fullPath } }
  }

  return true
})

export default router
