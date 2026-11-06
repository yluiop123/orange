<script setup lang="ts">
import { computed, ref } from 'vue'
import DemoSection from '@/components/demo/DemoSection.vue'


const tab = ref('anchor')
const snackbar = ref(false)
const snackbarText = ref('')

function notify(message: string) {
  snackbarText.value = message
  snackbar.value = true
}

/* Anchor */
const anchorBox = ref<HTMLElement | null>(null)
const activeAnchor = ref('section1')
const anchorSections = [
  { id: 'section1', title: 'Section 1', color: 'rgb(239, 68, 68)' },
  { id: 'section2', title: 'Section 2', color: 'rgb(34, 197, 94)' },
  { id: 'section3', title: 'Section 3', color: 'rgb(59, 130, 246)' },
]

function scrollToAnchor(id: string) {
  const box = anchorBox.value
  if (!box) return
  const target = box.querySelector<HTMLElement>(`[data-anchor="${id}"]`)
  if (!target) return
  activeAnchor.value = id
  box.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' })
}

function onAnchorScroll() {
  const box = anchorBox.value
  if (!box) return
  const position = box.scrollTop + 40
  for (const section of anchorSections) {
    const element = box.querySelector<HTMLElement>(`[data-anchor="${section.id}"]`)
    if (
      element &&
      position >= element.offsetTop &&
      position < element.offsetTop + element.offsetHeight
    ) {
      activeAnchor.value = section.id
      break
    }
  }
}

/* Breadcrumb */
const iconCrumbs = [
  { key: 'home', label: 'Home', icon: 'mdi-home-outline', separator: 'mdi-chevron-right' },
  { key: 'docs', label: 'Docs', icon: '', separator: 'mdi-chevron-right' },
  { key: 'components', label: 'Components', icon: '', separator: 'mdi-circle-small' },
  { key: 'breadcrumb', label: 'Breadcrumb', icon: '', separator: '' },
]

/* Dropdown */
function handleSelect(label: string) {
  notify(`You selected: ${label}`)
}

/* Context menu */
const contextOpen = ref(false)
const showBookmarks = ref(true)
const showFullUrls = ref(false)
const contextPicked = ref('Nothing selected yet')

function pickContext(label: string) {
  contextPicked.value = label
  contextOpen.value = false
  notify(`You selected: ${label}`)
}

/* Sidebar */
const sidebarActive = ref('home')
const sidebarRail = ref(false)
const sidebarItems = [
  { value: 'home', title: 'Home / 首页', icon: 'mdi-home-outline', badge: '' },
  { value: 'inbox', title: 'Inbox / 收件箱', icon: 'mdi-inbox-outline', badge: '12' },
  { value: 'calendar', title: 'Calendar / 日历', icon: 'mdi-calendar-outline', badge: '' },
  { value: 'search', title: 'Search / 搜索', icon: 'mdi-magnify', badge: '' },
  { value: 'settings', title: 'Settings / 设置', icon: 'mdi-cog-outline', badge: '' },
]
const activeSidebarTitle = computed(
  () => sidebarItems.find((item) => item.value === sidebarActive.value)?.title ?? 'Home / 首页',
)

/* Navigation menu */
const homeLinks = [
  { title: 'Introduction', desc: 'Re-usable components built using Radix UI and Tailwind CSS.' },
  { title: 'Installation', desc: 'How to install dependencies and structure your app.' },
  { title: 'Typography', desc: 'Styles for headings, paragraphs, lists...etc' },
]
const componentLinks = [
  {
    title: 'Alert Dialog',
    desc: 'A modal dialog that interrupts the user with important content.',
  },
  { title: 'Hover Card', desc: 'Preview content available behind a link.' },
  { title: 'Progress', desc: 'An indicator showing the completion progress of a task.' },
  { title: 'Scroll Area', desc: 'Visually or semantically separates content.' },
  { title: 'Tabs', desc: 'Layered sections of content displayed one at a time.' },
  { title: 'Tooltip', desc: 'A popup that displays information on hover or focus.' },
]
const navSelected = ref('Docs')
const mobileNavOpen = ref(false)

function selectNav(label: string) {
  navSelected.value = label
  notify(label)
}

function selectMobileNav(label: string) {
  selectNav(label)
  mobileNavOpen.value = false
}

/* Pagination */
const page = ref(1)
const compactPage = ref(2)
const readonlyPage = ref(3)
const perPage = ref(10)
const perPageOptions = [5, 10, 20, 50]

/* Steps */
const step = ref(1)

/* Tabs */
const basicTab = ref('a')
const businessTab = ref('profile')
const controlledTab = ref('tab1')
const iconTab = ref('account')
const username = ref('')
const email = ref('')
</script>

<template>
  <div class="demo-page">

    <v-tabs v-model="tab" color="primary">
      <v-tab value="anchor">Anchor</v-tab>
      <v-tab value="breadcrumb">Breadcrumb</v-tab>
      <v-tab value="dropdown">Dropdown</v-tab>
      <v-tab value="contextMenu">ContextMenu</v-tab>
      <v-tab value="sidebar">Sidebar</v-tab>
      <v-tab value="navigationMenu">NavigationMenu</v-tab>
      <v-tab value="pagination">Pagination</v-tab>
      <v-tab value="steps">Steps</v-tab>
      <v-tab value="tabs">Tabs</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Anchor -->
      <v-window-item value="anchor">
        <div class="demo-grid">
          <DemoSection
            title="Scroll spy / 滚动监听"
            subtitle="The active link follows the section currently visible in the panel"
          >
            <div class="anchor-layout">
              <nav class="anchor-nav">
                <button
                  v-for="section in anchorSections"
                  :key="section.id"
                  type="button"
                  class="anchor-link"
                  :class="{ 'anchor-link--active': activeAnchor === section.id }"
                  @click="scrollToAnchor(section.id)"
                >
                  <span class="anchor-dot" :style="{ background: section.color }" />
                  {{ section.title }}
                </button>
              </nav>

              <div ref="anchorBox" class="anchor-scroll" @scroll.passive="onAnchorScroll">
                <section
                  v-for="(section, index) in anchorSections"
                  :key="section.id"
                  :data-anchor="section.id"
                  class="anchor-block"
                  :style="{ borderLeftColor: section.color }"
                >
                  <h3 class="anchor-title">{{ section.title }}</h3>
                  <p class="text-body-2 text-medium-emphasis">
                    这里是 {{ section.title }} 的内容，用于演示滚动效果与锚点导航。
                  </p>
                  <p v-for="line in 5" :key="line" class="anchor-paragraph">
                    Paragraph {{ line }} of section {{ index + 1 }}. Scroll this panel and the left
                    navigation highlights the section that is currently in view.
                  </p>
                </section>
              </div>
            </div>
            <div class="demo-note">
              Active anchor: <code class="mono">#{{ activeAnchor }}</code>
            </div>
          </DemoSection>

          <DemoSection
            title="Anchor buttons / 锚点按钮"
            subtitle="Jump directly to a section from a horizontal action row"
          >
            <div class="row">
              <v-btn
                v-for="section in anchorSections"
                :key="section.id"
                :color="activeAnchor === section.id ? 'primary' : undefined"
                :variant="activeAnchor === section.id ? 'flat' : 'outlined'"
                :prepend-icon="`mdi-numeric-${section.id.slice(-1)}-circle-outline`"
                @click="scrollToAnchor(section.id)"
              >
                {{ section.title }}
              </v-btn>
            </div>
            <div class="demo-note">
              Clicking a button smooth-scrolls the panel above and updates the active state.
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Breadcrumb -->
      <v-window-item value="breadcrumb">
        <div class="demo-grid">
          <DemoSection
            title="Basic & custom separators"
            subtitle="The default chevron and a custom slash divider"
          >
            <v-breadcrumbs
              :items="['Home', 'Docs', 'Components', 'Breadcrumb']"
              density="comfortable"
            >
              <template #divider>
                <v-icon size="16">mdi-chevron-right</v-icon>
              </template>
            </v-breadcrumbs>
            <v-breadcrumbs :items="['Home', 'Docs', 'Components', 'Breadcrumb']" density="compact">
              <template #divider>
                <span class="crumb-sep">/</span>
              </template>
            </v-breadcrumbs>
          </DemoSection>

          <DemoSection
            title="Icons & per-item separators"
            subtitle="A home icon plus a different separator for one item"
          >
            <nav class="crumbs" aria-label="breadcrumb">
              <template v-for="(crumb, index) in iconCrumbs" :key="crumb.key">
                <v-icon v-if="crumb.icon" size="16" class="crumb-icon">{{ crumb.icon }}</v-icon>
                <span class="crumb" :class="{ 'crumb--current': index === iconCrumbs.length - 1 }">
                  {{ crumb.label }}
                </span>
                <v-icon v-if="crumb.separator" size="16" class="crumb-icon">
                  {{ crumb.separator }}
                </v-icon>
              </template>
            </nav>
          </DemoSection>

          <DemoSection
            title="Dropdown breadcrumb"
            subtitle="A middle crumb opens a menu of sibling destinations"
          >
            <nav class="crumbs" aria-label="breadcrumb">
              <v-icon size="16" class="crumb-icon">mdi-home-outline</v-icon>
              <span class="crumb">Home</span>
              <v-icon size="16" class="crumb-icon">mdi-chevron-right</v-icon>
              <v-menu location="bottom start">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    size="small"
                    append-icon="mdi-chevron-down"
                    class="crumb-menu"
                  >
                    Docs
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item title="Getting started" @click="notify('Getting started')" />
                  <v-list-item title="Components" @click="notify('Components')" />
                  <v-list-item title="Primitives" @click="notify('Primitives')" />
                </v-list>
              </v-menu>
              <v-icon size="16" class="crumb-icon">mdi-chevron-right</v-icon>
              <span class="crumb">Components</span>
              <v-icon size="16" class="crumb-icon">mdi-chevron-right</v-icon>
              <span class="crumb crumb--current">Breadcrumb</span>
            </nav>
            <p class="demo-note">
              Breadcrumbs describe the path, not the navigation history. The last crumb is never a
              link.
            </p>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Dropdown -->
      <v-window-item value="dropdown">
        <div class="demo-grid">
          <DemoSection title="Button trigger / 按钮触发" subtitle="A simple action menu with icons">
            <div class="row">
              <v-menu location="bottom start">
                <template #activator="{ props: activatorProps }">
                  <v-btn v-bind="activatorProps" variant="outlined" append-icon="mdi-chevron-down">
                    操作 / Actions
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-file-plus-outline"
                    title="新建 / New"
                    @click="handleSelect('New')"
                  />
                  <v-list-item
                    prepend-icon="mdi-pencil-outline"
                    title="编辑 / Edit"
                    @click="handleSelect('Edit')"
                  />
                  <v-list-item
                    prepend-icon="mdi-delete-outline"
                    title="删除 / Delete"
                    base-color="error"
                    @click="handleSelect('Delete')"
                  />
                </v-list>
              </v-menu>
            </div>
            <div class="demo-note">
              Choosing an item raises a snackbar with the selected action.
            </div>
          </DemoSection>

          <DemoSection
            title="Group & disabled / 分组与禁用"
            subtitle="Section labels, separators and a disabled entry"
          >
            <div class="row">
              <v-menu location="bottom start">
                <template #activator="{ props: activatorProps }">
                  <v-btn v-bind="activatorProps" variant="outlined" append-icon="mdi-chevron-down">
                    用户管理 / User Menu
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-subheader>账户操作 / Account Actions</v-list-subheader>
                  <v-list-item
                    prepend-icon="mdi-account-outline"
                    title="个人信息 / Profile"
                    @click="handleSelect('Profile')"
                  />
                  <v-list-item
                    prepend-icon="mdi-cog-outline"
                    title="设置（禁用）/ Settings (Disabled)"
                    disabled
                  />
                  <v-divider />
                  <v-list-item
                    prepend-icon="mdi-logout"
                    title="退出登录 / Logout"
                    base-color="error"
                    @click="handleSelect('Logout')"
                  />
                </v-list>
              </v-menu>
            </div>
          </DemoSection>

          <DemoSection
            title="Submenu / 子菜单"
            subtitle="A nested menu opens beside its parent item"
          >
            <div class="row">
              <v-menu location="bottom start">
                <template #activator="{ props: activatorProps }">
                  <v-btn v-bind="activatorProps" variant="outlined" append-icon="mdi-chevron-down">
                    更多选项 / More Options
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item title="简单项 / Simple Item" @click="handleSelect('Simple Item')" />
                  <v-menu location="end" submenu>
                    <template #activator="{ props: subProps }">
                      <v-list-item
                        v-bind="subProps"
                        title="高级设置 / Advanced"
                        append-icon="mdi-chevron-right"
                      />
                    </template>
                    <v-list density="compact">
                      <v-list-item title="安全设置 / Security" @click="handleSelect('Security')" />
                      <v-list-item title="隐私设置 / Privacy" @click="handleSelect('Privacy')" />
                    </v-list>
                  </v-menu>
                </v-list>
              </v-menu>
            </div>
          </DemoSection>

          <DemoSection
            title="Menu locations / 弹出位置"
            subtitle="Open the same list toward each edge of the trigger"
          >
            <div class="row">
              <v-menu
                v-for="location in ['bottom', 'top', 'start', 'end']"
                :key="location"
                :location="location"
              >
                <template #activator="{ props: activatorProps }">
                  <v-btn v-bind="activatorProps" variant="tonal" size="small">{{ location }}</v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item title="菜单项 A / Menu A" @click="handleSelect('Menu A')" />
                  <v-list-item title="菜单项 B / Menu B" @click="handleSelect('Menu B')" />
                </v-list>
              </v-menu>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- ContextMenu -->
      <v-window-item value="contextMenu">
        <div class="demo-grid">
          <DemoSection
            title="Right-click menu / 右键菜单"
            subtitle="Right-click inside the dashed area to open the menu"
          >
            <v-menu
              v-model="contextOpen"
              :open-on-click="false"
              :close-on-content-click="false"
              location="bottom start"
            >
              <template #activator="{ props: activatorProps }">
                <div
                  v-bind="activatorProps"
                  class="context-zone"
                  @contextmenu.prevent="contextOpen = true"
                >
                  <v-icon size="30">mdi-cursor-default-click-outline</v-icon>
                  <div class="context-zone__title">Right click here</div>
                  <div class="demo-note">右键点击此区域 / Open the context menu</div>
                </div>
              </template>

              <v-list density="compact" style="min-width: 260px">
                <v-list-item @click="pickContext('Back')">
                  <template #prepend><v-icon>mdi-arrow-left</v-icon></template>
                  <v-list-item-title>返回 / Back</v-list-item-title>
                  <template #append><span class="shortcut mono">⌘[</span></template>
                </v-list-item>
                <v-list-item disabled>
                  <template #prepend><v-icon>mdi-arrow-right</v-icon></template>
                  <v-list-item-title>前进 / Forward</v-list-item-title>
                  <template #append><span class="shortcut mono">⌘]</span></template>
                </v-list-item>
                <v-list-item @click="pickContext('Reload')">
                  <template #prepend><v-icon>mdi-refresh</v-icon></template>
                  <v-list-item-title>重新加载 / Reload</v-list-item-title>
                  <template #append><span class="shortcut mono">⌘R</span></template>
                </v-list-item>

                <v-menu location="end" submenu>
                  <template #activator="{ props: subProps }">
                    <v-list-item
                      v-bind="subProps"
                      title="More Tools"
                      append-icon="mdi-chevron-right"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item title="复制 / Copy" @click="pickContext('Copy')" />
                    <v-list-item title="粘贴 / Paste" @click="pickContext('Paste')" />
                    <v-list-item title="重命名 / Rename" @click="pickContext('Rename')" />
                    <v-divider />
                    <v-list-item title="Developer Tools" @click="pickContext('Developer Tools')" />
                    <v-divider />
                    <v-list-item
                      title="删除 / Delete"
                      base-color="error"
                      @click="pickContext('Delete')"
                    />
                  </v-list>
                </v-menu>

                <v-divider />
                <v-list-item @click="showBookmarks = !showBookmarks">
                  <template #prepend><v-checkbox-btn :model-value="showBookmarks" /></template>
                  <v-list-item-title>显示书签 / Show Bookmarks</v-list-item-title>
                </v-list-item>
                <v-list-item @click="showFullUrls = !showFullUrls">
                  <template #prepend><v-checkbox-btn :model-value="showFullUrls" /></template>
                  <v-list-item-title>显示完整URL / Show Full URLs</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </DemoSection>

          <DemoSection
            title="Selection state"
            subtitle="The menu reports the last action and its checkbox options"
          >
            <div class="context-status">
              <div>
                <span class="text-medium-emphasis">Last action / 最近操作:</span>
                <code class="mono context-status__value">{{ contextPicked }}</code>
              </div>
              <v-switch
                v-model="showBookmarks"
                label="Show bookmarks"
                color="primary"
                density="compact"
                hide-details
              />
              <v-switch
                v-model="showFullUrls"
                label="Show full URLs"
                color="primary"
                density="compact"
                hide-details
              />
            </div>
            <p class="demo-note">
              Checkbox items keep the menu open, while action items close it and raise a snackbar.
            </p>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Sidebar -->
      <v-window-item value="sidebar">
        <div class="demo-grid">
          <DemoSection
            title="Embedded sidebar / 内嵌侧边栏"
            subtitle="A local vertical menu that does not affect the global layout"
          >
            <div class="sidebar-demo">
              <aside class="local-side">
                <div class="local-side__head">子页面菜单 / Local Menu</div>
                <v-list nav density="compact" class="side-list">
                  <v-list-item
                    v-for="item in sidebarItems"
                    :key="item.value"
                    :value="item.value"
                    :active="sidebarActive === item.value"
                    @click="sidebarActive = item.value"
                  >
                    <template #prepend
                      ><v-icon>{{ item.icon }}</v-icon></template
                    >
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <template v-if="item.badge" #append>
                      <v-badge :content="item.badge" color="error" inline />
                    </template>
                  </v-list-item>
                </v-list>
              </aside>
              <div class="sidebar-content">
                <h3 class="sidebar-content__title">{{ activeSidebarTitle }}</h3>
                <p class="text-body-2 text-medium-emphasis">
                  This sidebar is fully local. Selecting an item only changes the panel beside it.
                </p>
                <div class="sidebar-metric-grid">
                  <div class="sidebar-metric">
                    <span class="sidebar-metric__value">128</span>
                    <span class="sidebar-metric__label">records</span>
                  </div>
                  <div class="sidebar-metric">
                    <span class="sidebar-metric__value">12</span>
                    <span class="sidebar-metric__label">unread</span>
                  </div>
                </div>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="Rail mode / 折叠栏"
            subtitle="Collapse the labels to leave an icon-only rail"
          >
            <v-switch
              v-model="sidebarRail"
              label="Collapse to rail"
              color="primary"
              density="compact"
              hide-details
            />
            <div class="sidebar-demo">
              <aside class="local-side" :class="{ 'local-side--rail': sidebarRail }">
                <div v-if="!sidebarRail" class="local-side__head">Navigation</div>
                <v-list nav density="compact" class="side-list">
                  <v-list-item
                    v-for="item in sidebarItems"
                    :key="item.value"
                    :value="item.value"
                    :active="sidebarActive === item.value"
                    @click="sidebarActive = item.value"
                  >
                    <template #prepend
                      ><v-icon>{{ item.icon }}</v-icon></template
                    >
                    <v-list-item-title v-if="!sidebarRail">{{ item.title }}</v-list-item-title>
                    <template v-if="item.badge && !sidebarRail" #append>
                      <v-badge :content="item.badge" color="error" inline />
                    </template>
                  </v-list-item>
                </v-list>
              </aside>
              <div class="sidebar-content">
                <p class="text-body-2 text-medium-emphasis">
                  The rail keeps the icons reachable while reclaiming horizontal space for content.
                </p>
                <div class="demo-note mono">
                  rail: {{ sidebarRail }} · active: {{ sidebarActive }}
                </div>
              </div>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- NavigationMenu -->
      <v-window-item value="navigationMenu">
        <div class="demo-grid">
          <DemoSection
            title="Horizontal navigation / 横向导航"
            subtitle="Rich dropdown menus with descriptions and featured content"
          >
            <div class="nav-bar">
              <v-menu open-on-hover location="bottom start" :open-delay="80">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    append-icon="mdi-chevron-down"
                    class="nav-trigger"
                  >
                    Home
                  </v-btn>
                </template>
                <div class="mega-menu mega-menu--home">
                  <div class="mega-feature">
                    <div class="mega-feature__title">shadcn/ui</div>
                    <p class="mega-feature__text">
                      Beautifully designed components built with Tailwind CSS.
                    </p>
                  </div>
                  <div class="mega-list">
                    <div
                      v-for="item in homeLinks"
                      :key="item.title"
                      class="mega-item"
                      @click="selectNav(item.title)"
                    >
                      <div class="mega-item__title">{{ item.title }}</div>
                      <div class="mega-item__desc">{{ item.desc }}</div>
                    </div>
                  </div>
                </div>
              </v-menu>

              <v-menu open-on-hover location="bottom start" :open-delay="80">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    append-icon="mdi-chevron-down"
                    class="nav-trigger"
                  >
                    Components
                  </v-btn>
                </template>
                <div class="mega-menu mega-menu--components">
                  <div
                    v-for="item in componentLinks"
                    :key="item.title"
                    class="mega-item"
                    @click="selectNav(item.title)"
                  >
                    <div class="mega-item__title">{{ item.title }}</div>
                    <div class="mega-item__desc">{{ item.desc }}</div>
                  </div>
                </div>
              </v-menu>

              <v-btn variant="text" class="nav-trigger" @click="selectNav('Docs')">Docs</v-btn>

              <v-menu open-on-hover location="bottom start" :open-delay="80">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    append-icon="mdi-chevron-down"
                    class="nav-trigger"
                  >
                    List
                  </v-btn>
                </template>
                <v-list density="compact" style="min-width: 240px">
                  <v-list-item
                    title="Components"
                    subtitle="Browse all components in the library."
                    @click="selectNav('Components')"
                  />
                  <v-list-item
                    title="Documentation"
                    subtitle="Learn how to use the library."
                    @click="selectNav('Documentation')"
                  />
                  <v-list-item
                    title="Blog"
                    subtitle="Read our latest blog posts."
                    @click="selectNav('Blog')"
                  />
                </v-list>
              </v-menu>

              <v-menu open-on-hover location="bottom start" :open-delay="80">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    append-icon="mdi-chevron-down"
                    class="nav-trigger"
                  >
                    Simple
                  </v-btn>
                </template>
                <v-list density="compact" style="min-width: 180px">
                  <v-list-item title="Components" @click="selectNav('Components')" />
                  <v-list-item title="Documentation" @click="selectNav('Documentation')" />
                  <v-list-item title="Blocks" @click="selectNav('Blocks')" />
                </v-list>
              </v-menu>

              <v-menu open-on-hover location="bottom start" :open-delay="80">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    variant="text"
                    append-icon="mdi-chevron-down"
                    class="nav-trigger"
                  >
                    With Icon
                  </v-btn>
                </template>
                <v-list density="compact" style="min-width: 180px">
                  <v-list-item
                    prepend-icon="mdi-help-circle-outline"
                    title="Backlog"
                    @click="selectNav('Backlog')"
                  />
                  <v-list-item
                    prepend-icon="mdi-circle-outline"
                    title="To Do"
                    @click="selectNav('To Do')"
                  />
                  <v-list-item
                    prepend-icon="mdi-check-circle-outline"
                    title="Done"
                    @click="selectNav('Done')"
                  />
                </v-list>
              </v-menu>
            </div>

            <div class="row">
              <v-chip variant="tonal" prepend-icon="mdi-cursor-default-click-outline">
                Selected: {{ navSelected }}
              </v-chip>
              <v-btn size="small" variant="text" @click="selectNav('Docs')">Reset to Docs</v-btn>
            </div>
          </DemoSection>

          <DemoSection
            title="Compact navigation / 紧凑导航"
            subtitle="The same destinations collapse behind a single trigger"
          >
            <div class="nav-bar nav-bar--compact">
              <span class="nav-brand">ORANGE</span>
              <v-menu v-model="mobileNavOpen" location="bottom end">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    :icon="mobileNavOpen ? 'mdi-close' : 'mdi-menu'"
                    variant="text"
                    aria-label="Toggle navigation"
                  />
                </template>
                <v-list density="compact" style="min-width: 220px">
                  <v-list-item
                    v-for="item in ['Home', 'Components', 'Docs', 'List', 'Simple']"
                    :key="item"
                    :title="item"
                    @click="selectMobileNav(item)"
                  />
                </v-list>
              </v-menu>
            </div>
            <p class="demo-note">
              In a real shell the trigger appears below the md breakpoint; here the menu is always
              available.
            </p>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Pagination -->
      <v-window-item value="pagination">
        <div class="demo-grid">
          <DemoSection
            title="Pagination example / 分页示例"
            subtitle="A controlled page bound to a content panel"
          >
            <div class="pager-center">
              <v-pagination v-model="page" :length="5" :total-visible="5" />
              <div class="pager-card">
                <div class="pager-card__title">当前显示第 {{ page }} 页内容</div>
                <div class="text-body-2 text-medium-emphasis">
                  Showing content for page {{ page }}.
                </div>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="Compact & custom icons"
            subtitle="Density and navigation icons adapt to tight toolbars"
          >
            <div class="pager-center">
              <v-pagination
                v-model="compactPage"
                :length="4"
                :total-visible="3"
                density="compact"
                prev-icon="mdi-arrow-left"
                next-icon="mdi-arrow-right"
              />
              <div class="pager-center__hint mono">compact page: {{ compactPage }}</div>
              <v-pagination v-model="readonlyPage" :length="6" :total-visible="5" disabled />
            </div>
          </DemoSection>

          <DemoSection
            title="Page size / 每页条数"
            subtitle="Combine pagination with a page-size selector"
          >
            <div class="pager-controls">
              <span class="text-body-2">Rows per page</span>
              <v-select
                v-model="perPage"
                :items="perPageOptions"
                density="compact"
                hide-details
                style="max-width: 120px"
              />
              <span class="demo-note">
                Page {{ page }} · {{ perPage }} rows · records {{ (page - 1) * perPage + 1 }}–{{
                  page * perPage
                }}
              </span>
            </div>
            <v-pagination v-model="page" :length="8" :total-visible="6" />
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Steps -->
      <v-window-item value="steps">
        <div class="demo-grid">
          <DemoSection
            title="Horizontal steps / 横向步骤条"
            subtitle="Linear onboarding flow with validation state"
          >
            <v-stepper v-model="step" :items="['登录', '验证', '完成']" flat>
              <template #item.1>
                <p class="text-body-2 mb-3">
                  Create the account, choose a username and a strong password.
                </p>
              </template>
              <template #item.2>
                <p class="text-body-2 mb-3">
                  安全校验中 · attach the account to an organization code.
                </p>
              </template>
              <template #item.3>
                <p class="text-body-2 mb-3">
                  Review the summary and submit. A temporary password is shown once.
                </p>
              </template>
              <template #actions>
                <div class="stepper-actions">
                  <v-btn variant="text" :disabled="step === 1" @click="step -= 1">Back</v-btn>
                  <v-spacer />
                  <v-btn color="primary" :disabled="step === 3" @click="step += 1">Next</v-btn>
                </div>
              </template>
            </v-stepper>
            <div class="demo-note mono">current step: {{ step }}</div>
          </DemoSection>

          <DemoSection
            title="Vertical steps / 纵向步骤条"
            subtitle="Success, process and error statuses in a compact timeline"
          >
            <v-timeline density="compact" side="end" truncate-line="both">
              <v-timeline-item dot-color="success" size="small" fill-dot>
                <div class="step-title">提交 / Submit</div>
                <div class="text-body-2 text-medium-emphasis">
                  The request was accepted and queued.
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="primary" size="small" fill-dot>
                <div class="step-title">审核中 / In Review</div>
                <div class="text-body-2 text-medium-emphasis">
                  An operator is checking the payload.
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="error" size="small" fill-dot>
                <div class="step-title">失败 / Failed</div>
                <div class="text-body-2 text-medium-emphasis">
                  Validation failed. Fix the highlighted fields and retry.
                </div>
              </v-timeline-item>
            </v-timeline>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Tabs -->
      <v-window-item value="tabs">
        <div class="demo-grid">
          <DemoSection
            title="Basic usage / 基础用法"
            subtitle="Nested tabs switch two simple panels"
          >
            <v-tabs v-model="basicTab" color="primary">
              <v-tab value="a">标签 A (Tab A)</v-tab>
              <v-tab value="b">标签 B (Tab B)</v-tab>
            </v-tabs>
            <v-window v-model="basicTab">
              <v-window-item value="a">
                <div class="tab-panel">内容 A (Content A)</div>
              </v-window-item>
              <v-window-item value="b">
                <div class="tab-panel">内容 B (Content B)</div>
              </v-window-item>
            </v-window>
          </DemoSection>

          <DemoSection
            title="Business scenario / 业务场景"
            subtitle="Profile, security and notification settings inside tabs"
          >
            <v-tabs v-model="businessTab" color="primary">
              <v-tab value="profile">个人信息 (Profile)</v-tab>
              <v-tab value="security">安全设置 (Security)</v-tab>
              <v-tab value="notify">通知设置 (Notification)</v-tab>
            </v-tabs>
            <v-window v-model="businessTab">
              <v-window-item value="profile">
                <div class="tab-form">
                  <v-text-field
                    v-model="username"
                    label="用户名 (Username)"
                    placeholder="Username"
                    hide-details
                  />
                  <v-text-field
                    v-model="email"
                    label="邮箱 (Email)"
                    placeholder="Email"
                    hide-details
                  />
                  <v-btn color="primary" @click="notify('Profile saved')">保存 (Save)</v-btn>
                </div>
              </v-window-item>
              <v-window-item value="security">
                <div class="tab-form">
                  <v-text-field type="password" label="新密码 (New Password)" hide-details />
                  <v-btn color="error" variant="tonal" @click="notify('Password changed')">
                    修改密码 (Change Password)
                  </v-btn>
                </div>
              </v-window-item>
              <v-window-item value="notify">
                <p class="text-body-2 text-medium-emphasis">
                  通知偏好设置内容 (Notification preferences)
                </p>
              </v-window-item>
            </v-window>
          </DemoSection>

          <DemoSection
            title="Controlled tabs / 受控模式"
            subtitle="External buttons drive the active tab"
          >
            <div class="row">
              <v-btn variant="outlined" size="small" @click="controlledTab = 'tab1'"
                >Go to Tab 1</v-btn
              >
              <v-btn variant="outlined" size="small" @click="controlledTab = 'tab2'"
                >Go to Tab 2</v-btn
              >
            </div>
            <v-tabs v-model="controlledTab" color="primary">
              <v-tab value="tab1">标签 1 (Tab 1)</v-tab>
              <v-tab value="tab2">标签 2 (Tab 2)</v-tab>
            </v-tabs>
            <v-window v-model="controlledTab">
              <v-window-item value="tab1">
                <div class="tab-panel">
                  当前标签：<b class="ml-1">{{ controlledTab }}</b>
                </div>
              </v-window-item>
              <v-window-item value="tab2">
                <div class="tab-panel">
                  当前标签：<b class="ml-1">{{ controlledTab }}</b>
                </div>
              </v-window-item>
            </v-window>
          </DemoSection>

          <DemoSection
            title="Icon tabs & card / 图标与卡片"
            subtitle="Icons and tab panels wrapped in a card"
          >
            <v-card variant="outlined" class="tab-card">
              <v-tabs v-model="iconTab" color="primary">
                <v-tab value="account" prepend-icon="mdi-account-outline">账号 (Account)</v-tab>
                <v-tab value="security" prepend-icon="mdi-lock-outline">安全 (Security)</v-tab>
                <v-tab value="notify" prepend-icon="mdi-bell-outline">通知 (Notify)</v-tab>
              </v-tabs>
              <v-window v-model="iconTab">
                <v-window-item value="account">
                  <v-card-text class="text-body-2">账号相关内容 (Account content)</v-card-text>
                </v-window-item>
                <v-window-item value="security">
                  <v-card-text class="text-body-2">安全相关内容 (Security content)</v-card-text>
                </v-window-item>
                <v-window-item value="notify">
                  <v-card-text class="text-body-2">通知相关内容 (Notification content)</v-card-text>
                </v-window-item>
              </v-window>
            </v-card>
          </DemoSection>
        </div>
      </v-window-item>
    </v-window>

    <v-snackbar v-model="snackbar" :timeout="2200" location="bottom">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* Anchor */
.anchor-layout {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.anchor-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
}

.anchor-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease;
}

.anchor-link:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
}

.anchor-link--active {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

.anchor-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.anchor-scroll {
  position: relative;
  height: 360px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.anchor-block {
  min-height: 280px;
  padding: 16px;
  border-left: 3px solid;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.anchor-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.anchor-paragraph {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Breadcrumb */
.crumb-sep {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.crumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  min-height: 36px;
}

.crumb-icon {
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.8;
}

.crumb {
  color: rgb(var(--v-theme-on-surface-variant));
}

.crumb--current {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}

.crumb-menu {
  min-width: 0;
  padding: 0 4px;
  height: 26px;
  font-size: 13px;
}

/* Context menu */
.context-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 170px;
  padding: 20px;
  border: 1.5px dashed rgba(var(--v-border-color), 1);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: context-menu;
  user-select: none;
}

.context-zone__title {
  font-size: 14px;
  font-weight: 650;
  color: rgb(var(--v-theme-on-surface));
}

.shortcut {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 11px;
}

.context-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
}

.context-status__value {
  margin-left: 6px;
}

/* Sidebar */
.sidebar-demo {
  display: flex;
  align-items: stretch;
  min-height: 220px;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.local-side {
  flex: 0 0 300px;
  width: 300px;
  padding: 10px;
  border-right: 1px solid rgba(var(--v-border-color), 0.7);
  background: rgb(var(--v-theme-surface-variant));
  transition:
    flex-basis 0.18s ease,
    width 0.18s ease,
    padding 0.18s ease;
}

.local-side--rail {
  flex-basis: 56px;
  width: 56px;
  padding: 10px 4px;
}

.local-side__head {
  padding: 4px 8px 10px;
  font-size: 13px;
  font-weight: 650;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.6);
  margin-bottom: 6px;
}

.side-list {
  background: transparent;
}

.sidebar-content {
  flex: 1 1 auto;
  min-width: 0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-content__title {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
}

.sidebar-metric-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.sidebar-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 90px;
  padding: 10px 14px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
  border-radius: 8px;
}

.sidebar-metric__value {
  font-size: 20px;
  font-weight: 700;
}

.sidebar-metric__label {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Navigation menu */
.nav-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  padding: 6px;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
}

.nav-bar--compact {
  justify-content: space-between;
}

.nav-brand {
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.nav-trigger {
  text-transform: none;
  font-size: 13px;
}

.mega-menu {
  padding: 10px;
  border: 1px solid rgba(var(--v-border-color), 0.8);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 16px 40px rgb(0 0 0 / 0.16);
}

.mega-menu--home {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 10px;
  width: min(540px, 88vw);
}

.mega-menu--components {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  width: min(560px, 88vw);
}

.mega-feature {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-radius: 9px;
  background: rgb(var(--v-theme-surface-variant));
}

.mega-feature__title {
  font-size: 18px;
  font-weight: 700;
}

.mega-feature__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface-variant));
}

.mega-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mega-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.16s ease;
}

.mega-item:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.mega-item__title {
  font-size: 13px;
  font-weight: 600;
}

.mega-item__desc {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Pagination */
.pager-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pager-center__hint {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.pager-card {
  width: min(340px, 100%);
  padding: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
  text-align: center;
}

.pager-card__title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 2px;
}

.pager-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

/* Steps */
.step-title {
  font-size: 13px;
  font-weight: 650;
}

.stepper-actions {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  margin-top: 12px;
}

/* Tabs */
.tab-panel {
  padding: 14px;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 13px;
}

.tab-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
}

.tab-form :deep(.v-btn) {
  align-self: flex-start;
}

.tab-card {
  border-color: rgba(var(--v-border-color), 0.7);
}

@media (max-width: 720px) {
  .anchor-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .anchor-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .mega-menu--home,
  .mega-menu--components {
    grid-template-columns: minmax(0, 1fr);
    width: min(360px, 90vw);
  }

  .sidebar-demo {
    flex-direction: column;
  }

  .local-side,
  .local-side--rail {
    flex-basis: auto;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(var(--v-border-color), 0.7);
  }
}
</style>
