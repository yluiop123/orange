import { Routes } from '@angular/router';
import { authGuard, identityGuard, permissionGuard } from './core/guards';
import { ShellComponent } from './layout/shell.component';
import { MenuRedirectComponent } from './layout/menu-redirect.component';

const page = (
  path: string,
  permissionPath: string,
  loadComponent: () => Promise<unknown>,
): Routes[number] => ({
  path: path.replace(/^\/+/, ''),
  canActivate: [permissionGuard],
  data: { path: permissionPath },
  loadComponent: loadComponent as Routes[number]['loadComponent'],
});

const container = (path: string): Routes[number] => ({
  path,
  component: MenuRedirectComponent,
  data: { nodePath: `/${path}` },
});

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'swagger',
    loadComponent: () =>
      import('./pages/swagger/swagger-page.component').then((m) => m.SwaggerPageComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard, identityGuard],
    children: [
      { path: '', pathMatch: 'full', component: MenuRedirectComponent },
      page('/dashboard/normal', '/dashboard/normal', () =>
        import('./pages/dashboard/normal/dashboard-normal.component').then(
          (m) => m.DashboardNormalComponent,
        ),
      ),
      page('/dashboard/network-security', '/dashboard/network-security', () =>
        import('./pages/dashboard/network-security/dashboard-network.component').then(
          (m) => m.DashboardNetworkComponent,
        ),
      ),
      page('/dashboard/military-situational-awareness', '/dashboard/military-situational-awareness', () =>
        import(
          './pages/dashboard/military-situational-awareness/dashboard-military.component'
        ).then((m) => m.DashboardMilitaryComponent),
      ),
      page('/dashboard/disaster-command', '/dashboard/disaster-command', () =>
        import('./pages/dashboard/disaster-command/dashboard-disaster.component').then(
          (m) => m.DashboardDisasterComponent,
        ),
      ),
      page('/dashboard/agriculture-forestry', '/dashboard/agriculture-forestry', () =>
        import('./pages/dashboard/agriculture-forestry/dashboard-agriculture.component').then(
          (m) => m.DashboardAgricultureComponent,
        ),
      ),
      page('/dashboard/industrial', '/dashboard/industrial', () =>
        import('./pages/dashboard/industrial/dashboard-industrial.component').then(
          (m) => m.DashboardIndustrialComponent,
        ),
      ),
      page('/chart/antv', '/chart/antv', () =>
        import('./pages/chart/antv/chart-antv.component').then((m) => m.ChartAntvComponent),
      ),
      page('/chart/d3', '/chart/d3', () =>
        import('./pages/chart/d3/chart-d3.component').then((m) => m.ChartD3Component),
      ),
      page('/chart/echart', '/chart/echart', () =>
        import('./pages/chart/echart/chart-echart.component').then((m) => m.ChartEchartComponent),
      ),
      page('/chart/rechart', '/chart/rechart', () =>
        import('./pages/chart/rechart/chart-rechart.component').then((m) => m.ChartRechartComponent),
      ),
      page('/map/cesium', '/map/cesium', () =>
        import('./pages/map/cesium/map-cesium.component').then((m) => m.MapCesiumComponent),
      ),
      page('/map/deckgl', '/map/deckgl', () =>
        import('./pages/map/deckgl/map-deckgl.component').then((m) => m.MapDeckglComponent),
      ),
      page('/map/l7', '/map/l7', () =>
        import('./pages/map/l7/map-l7.component').then((m) => m.MapL7Component),
      ),
      page('/map/leaflet', '/map/leaflet', () =>
        import('./pages/map/leaflet/map-leaflet.component').then((m) => m.MapLeafletComponent),
      ),
      page('/map/openlayers', '/map/openlayers', () =>
        import('./pages/map/openlayers/map-openlayers.component').then(
          (m) => m.MapOpenlayersComponent,
        ),
      ),
      page('/three/three', '/three/three', () =>
        import('./pages/three/three/three-scene.component').then((m) => m.ThreeSceneComponent),
      ),
      page('/three/babylon', '/three/babylon', () =>
        import('./pages/three/babylon/babylon-scene.component').then(
          (m) => m.BabylonSceneComponent,
        ),
      ),
      page('/component/general', '/component/general', () =>
        import('./pages/component/general/component-general.component').then(
          (m) => m.ComponentGeneralComponent,
        ),
      ),
      page('/component/layout', '/component/layout', () =>
        import('./pages/component/layout/component-layout.component').then(
          (m) => m.ComponentLayoutComponent,
        ),
      ),
      page('/component/navigation', '/component/navigation', () =>
        import('./pages/component/navigation/component-navigation.component').then(
          (m) => m.ComponentNavigationComponent,
        ),
      ),
      page('/component/table', '/component/table', () =>
        import('./pages/component/table/component-table.component').then(
          (m) => m.ComponentTableComponent,
        ),
      ),
      page('/component/form', '/component/form', () =>
        import('./pages/component/form/component-form.component').then(
          (m) => m.ComponentFormComponent,
        ),
      ),
      page('/component/display', '/component/display', () =>
        import('./pages/component/display/component-display.component').then(
          (m) => m.ComponentDisplayComponent,
        ),
      ),
      page('/component/feedback', '/component/feedback', () =>
        import('./pages/component/feedback/component-feedback.component').then(
          (m) => m.ComponentFeedbackComponent,
        ),
      ),
      page('/component/custom', '/component/custom', () =>
        import('./pages/component/custom/component-custom.component').then(
          (m) => m.ComponentCustomComponent,
        ),
      ),
      page('/system/user', '/system/user', () =>
        import('./pages/system/user/user-page.component').then((m) => m.UserPageComponent),
      ),
      page('/system/role', '/system/role', () =>
        import('./pages/system/role/role-page.component').then((m) => m.RolePageComponent),
      ),
      page('/system/group', '/system/group', () =>
        import('./pages/system/group/group-page.component').then((m) => m.GroupPageComponent),
      ),
      page('/system/permission', '/system/permission', () =>
        import('./pages/system/permission/permission-page.component').then(
          (m) => m.PermissionPageComponent,
        ),
      ),
      page('/system/operation-log', '/system/operation-log', () =>
        import('./pages/system/operation-log/operation-log-page.component').then(
          (m) => m.OperationLogPageComponent,
        ),
      ),
      container('dashboard'),
      container('chart'),
      container('map'),
      container('three'),
      container('component'),
      container('system'),
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
