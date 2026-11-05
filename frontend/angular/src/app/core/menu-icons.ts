import type { MenuNode } from './models';

/** Material icon equivalents of React's lucide menu icons. */
const ICONS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/normal': 'speed',
  '/dashboard/network-security': 'verified_user',
  '/dashboard/military-situational-awareness': 'shield',
  '/dashboard/disaster-command': 'crisis_alert',
  '/dashboard/agriculture-forestry': 'agriculture',
  '/dashboard/industrial': 'factory',
  '/component': 'extension',
  '/component/general': 'crop_square',
  '/component/layout': 'view_column',
  '/component/navigation': 'share',
  '/component/display': 'desktop_windows',
  '/component/feedback': 'notifications',
  '/component/form': 'description',
  '/component/table': 'table_chart',
  '/component/custom': 'build',
  '/chart': 'bar_chart',
  '/chart/rechart': 'show_chart',
  '/chart/echart': 'pie_chart',
  '/chart/d3': 'device_hub',
  '/chart/antv': 'trending_up',
  '/three': 'view_in_ar',
  '/three/babylon': 'deployed_code',
  '/three/three': '360',
  '/map': 'map',
  '/map/cesium': 'public',
  '/map/deckgl': 'layers',
  '/map/l7': 'radar',
  '/map/leaflet': 'location_on',
  '/map/openlayers': 'grid_view',
  '/system': 'settings',
  '/system/user': 'person',
  '/system/role': 'shield',
  '/system/group': 'group',
  '/system/permission': 'key',
  '/system/operation-log': 'receipt_long',
};

export function menuIcon(node: MenuNode): string {
  return ICONS[node.path] ?? (node.children.length > 0 ? 'folder' : 'chevron_right');
}
