import type { MenuNode } from './models';

const ICONS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/normal': 'space_dashboard',
  '/dashboard/network-security': 'security',
  '/dashboard/military-situational-awareness': 'radar',
  '/dashboard/disaster-command': 'crisis_alert',
  '/dashboard/agriculture-forestry': 'agriculture',
  '/dashboard/industrial': 'factory',
  '/component': 'widgets',
  '/component/general': 'smart_button',
  '/component/layout': 'view_quilt',
  '/component/navigation': 'navigation',
  '/component/table': 'table_chart',
  '/component/form': 'edit_note',
  '/component/display': 'image',
  '/component/feedback': 'feedback',
  '/component/custom': 'extension',
  '/chart': 'bar_chart',
  '/chart/antv': 'show_chart',
  '/chart/d3': 'scatter_plot',
  '/chart/echart': 'insights',
  '/chart/rechart': 'stacked_line_chart',
  '/three': 'view_in_ar',
  '/three/babylon': 'deployed_code',
  '/three/three': '360',
  '/map': 'map',
  '/map/cesium': 'public',
  '/map/deckgl': 'layers',
  '/map/l7': 'route',
  '/map/leaflet': 'pin_drop',
  '/map/openlayers': 'explore',
  '/system': 'settings',
  '/system/user': 'group',
  '/system/role': 'badge',
  '/system/group': 'account_tree',
  '/system/permission': 'key',
  '/system/operation-log': 'history',
};

export function menuIcon(node: MenuNode): string {
  return ICONS[node.path] ?? (node.children.length > 0 ? 'folder' : 'chevron_right');
}
