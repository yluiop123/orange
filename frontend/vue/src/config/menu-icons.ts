const ICONS: Array<{ match: string; icon: string }> = [
  { match: '/system/user', icon: 'mdi-account-multiple-outline' },
  { match: '/system/role', icon: 'mdi-shield-account-outline' },
  { match: '/system/group', icon: 'mdi-office-building-outline' },
  { match: '/system/permission', icon: 'mdi-key-outline' },
  { match: '/system/operation-log', icon: 'mdi-text-box-search-outline' },
  { match: '/system', icon: 'mdi-cog-outline' },
  { match: '/dashboard', icon: 'mdi-view-dashboard-outline' },
  { match: '/chart', icon: 'mdi-chart-box-outline' },
  { match: '/map', icon: 'mdi-map-outline' },
  { match: '/three', icon: 'mdi-cube-outline' },
  { match: '/component', icon: 'mdi-widgets-outline' },
]

export function getMenuIcon(path: string, type: 'menu' | 'directory'): string {
  if (type === 'directory') return 'mdi-folder-outline'
  const found = ICONS.find((item) => path.startsWith(item.match))
  return found?.icon ?? 'mdi-circle-small'
}
