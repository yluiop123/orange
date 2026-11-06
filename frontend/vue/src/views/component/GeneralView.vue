<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')

const tab = ref('button')
const loading = ref(false)
const align = ref('left')

const fabOpen = ref(false)
const topScroll = ref<HTMLElement | null>(null)

const offsetTop = ref(16)
const offsetBottom = ref(16)
const offsetLeft = ref(0)
const offsetRight = ref(0)

const snackbar = ref(false)
const snackbarText = ref('')

const copyableText = ref('Copyable 支持复制')
const editableText = ref('Editable 支持编辑')
const editing = ref(false)
const expanded = ref<Record<string, boolean>>({})

const longText =
  '这是一段很长的文本，用于演示省略、展开与收起。它会在有限的行数内被截断，点击按钮后可以查看完整内容。'.repeat(
    6,
  )
const middleText =
  '这是一段非常非常长的文本示例，用于展示中间省略，仅显示头尾，中间使用省略号衔接。'.repeat(8)
const middleTextDisplay = computed(() => `${middleText.slice(0, 72)}…${middleText.slice(-72)}`)

function simulateLoad() {
  loading.value = true
  window.setTimeout(() => {
    loading.value = false
  }, 2000)
}

async function copyValue(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    snackbarText.value = `Copied: ${text}`
  } catch {
    snackbarText.value = 'Clipboard is not available in this browser.'
  }
  snackbar.value = true
}

function toggleExpanded(key: string) {
  expanded.value[key] = !expanded.value[key]
}

function pickAction(label: string) {
  snackbarText.value = `${label} clicked`
  snackbar.value = true
}

function scrollPanelToTop() {
  topScroll.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetOffsets() {
  offsetTop.value = 16
  offsetBottom.value = 16
  offsetLeft.value = 0
  offsetRight.value = 0
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.general')" />

    <v-tabs v-model="tab" color="primary">
      <v-tab value="button">Button</v-tab>
      <v-tab value="floatButton">FloatButton</v-tab>
      <v-tab value="affix">Affix</v-tab>
      <v-tab value="typography">Typography</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Button -->
      <v-window-item value="button">
        <div class="demo-grid">
          <DemoSection title="Size 大小" subtitle="Small, default, large and icon-only buttons">
            <div class="row">
              <v-btn size="small">small</v-btn>
              <v-btn>default</v-btn>
              <v-btn size="large">large</v-btn>
              <v-btn icon="mdi-star-outline" variant="tonal" aria-label="Icon button" />
            </div>
          </DemoSection>

          <DemoSection title="Type 类型" subtitle="Semantic colors for actions and links">
            <div class="row">
              <v-btn>Default</v-btn>
              <v-btn color="primary">Primary 主要</v-btn>
              <v-btn color="secondary" class="text-high-emphasis">Secondary 次要</v-btn>
              <v-btn color="error">Destructive 危险</v-btn>
              <v-btn color="success">Success 成功</v-btn>
              <v-btn
                href="https://example.com"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                append-icon="mdi-open-in-new"
              >
                Link 链接
              </v-btn>
            </div>
          </DemoSection>

          <DemoSection title="Variant 变体" subtitle="Elevated, tonal, outlined, text and plain">
            <div class="row">
              <v-btn>default</v-btn>
              <v-btn color="error">destructive</v-btn>
              <v-btn variant="outlined">outline</v-btn>
              <v-btn variant="flat" color="secondary" class="text-high-emphasis">secondary</v-btn>
              <v-btn variant="text" class="text-high-emphasis">ghost</v-btn>
              <v-btn variant="plain" color="primary">link</v-btn>
            </div>
          </DemoSection>

          <DemoSection title="Status 状态" subtitle="Normal, disabled and an async loading action">
            <div class="row">
              <v-btn>Normal</v-btn>
              <v-btn disabled>Disabled</v-btn>
              <v-btn color="primary" :loading="loading" @click="simulateLoad">
                {{ loading ? 'Loading...' : 'Click to Load' }}
              </v-btn>
            </div>
          </DemoSection>

          <DemoSection
            title="Icon Button 图标按钮 & Shape 形状"
            subtitle="Leading icons, icon-only buttons and corner radius"
          >
            <div class="row">
              <v-btn prepend-icon="mdi-coffee-outline">Icon Button</v-btn>
              <v-btn color="success" prepend-icon="mdi-check">Success</v-btn>
              <v-btn icon="mdi-share-variant-outline" variant="tonal" aria-label="Share" />
              <v-btn icon="mdi-heart-outline" variant="text" aria-label="Favorite" />
            </div>
            <div class="row">
              <v-btn rounded="0">Square</v-btn>
              <v-btn rounded="lg">Round</v-btn>
              <v-btn rounded="pill" color="primary">Full Circle</v-btn>
            </div>
          </DemoSection>

          <DemoSection
            title="Button group 按钮组"
            subtitle="A segmented control bound to script state"
          >
            <v-btn-toggle v-model="align" divided variant="outlined" density="comfortable">
              <v-btn value="left" prepend-icon="mdi-format-align-left">Left</v-btn>
              <v-btn value="center" prepend-icon="mdi-format-align-center">Center</v-btn>
              <v-btn value="right" prepend-icon="mdi-format-align-right">Right</v-btn>
            </v-btn-toggle>
            <div class="demo-note">
              Selected alignment: <code class="mono">{{ align }}</code>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- FloatButton -->
      <v-window-item value="floatButton">
        <div class="demo-grid">
          <DemoSection
            title="Expandable action button"
            subtitle="The main button opens a group of secondary actions"
          >
            <div class="float-stage">
              <div class="skeleton-lines">
                <div class="skeleton-line skeleton-line--title" />
                <div v-for="index in 5" :key="index" class="skeleton-line" />
              </div>
              <v-menu v-model="fabOpen" location="top end" :offset="12">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    class="float-fab"
                    color="primary"
                    icon="mdi-plus"
                    size="large"
                    elevation="6"
                    aria-label="Quick actions"
                  />
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-pencil-outline"
                    title="Edit"
                    @click="pickAction('Edit')"
                  />
                  <v-list-item
                    prepend-icon="mdi-content-duplicate"
                    title="Duplicate"
                    @click="pickAction('Duplicate')"
                  />
                  <v-list-item
                    prepend-icon="mdi-delete-outline"
                    title="Delete"
                    base-color="error"
                    @click="pickAction('Delete')"
                  />
                </v-list>
              </v-menu>
            </div>
            <div class="demo-note">
              Open state: <code class="mono">{{ fabOpen }}</code>
            </div>
          </DemoSection>

          <DemoSection
            title="Expand direction & badges"
            subtitle="Speed dial groups expand upward and to the left"
          >
            <div class="float-stage float-stage--short">
              <v-speed-dial location="bottom end" direction="top">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    color="info"
                    icon="mdi-plus"
                    size="large"
                    aria-label="Expand upward"
                  />
                </template>
                <v-btn icon aria-label="Edit">
                  <v-badge content="2" color="error">
                    <v-icon>mdi-pencil</v-icon>
                  </v-badge>
                </v-btn>
                <v-btn icon aria-label="Delete">
                  <v-badge content="5" color="error">
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-badge>
                </v-btn>
              </v-speed-dial>

              <v-speed-dial location="bottom start" direction="right">
                <template #activator="{ props: activatorProps }">
                  <v-btn
                    v-bind="activatorProps"
                    color="success"
                    icon="mdi-share-variant"
                    size="large"
                    aria-label="Expand to the right"
                  />
                </template>
                <v-btn icon aria-label="Copy link">
                  <v-badge content="1" color="error">
                    <v-icon>mdi-link</v-icon>
                  </v-badge>
                </v-btn>
                <v-btn icon="mdi-email-outline" aria-label="Email" />
              </v-speed-dial>
            </div>
            <ul class="note-list">
              <li>
                The main button supports back-to-top, an expanding action group, or a custom click
                handler.
              </li>
              <li>Group buttons can show badge counts and use custom colors.</li>
              <li>Press Enter or Space to expand; press Esc or click outside to close.</li>
            </ul>
          </DemoSection>

          <DemoSection title="Back to top" subtitle="A floating control over a scrollable panel">
            <div class="float-stage">
              <div ref="topScroll" class="scroll-panel">
                <p v-for="index in 14" :key="index" class="scroll-line">
                  Scroll content {{ index }} · long pages keep the primary action within reach.
                </p>
              </div>
              <v-btn
                class="float-fab"
                color="primary"
                icon="mdi-arrow-up"
                elevation="6"
                aria-label="Back to top"
                @click="scrollPanelToTop"
              />
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Affix -->
      <v-window-item value="affix">
        <div class="demo-grid">
          <DemoSection
            title="Top Affix / 顶部固钉"
            subtitle="Sticky header with adjustable top, left and right offsets"
          >
            <div class="control-grid">
              <v-slider
                v-model="offsetTop"
                label="Offset Top"
                :min="0"
                :max="120"
                :step="4"
                hide-details
              />
              <v-slider
                v-model="offsetLeft"
                label="Left"
                :min="0"
                :max="120"
                :step="4"
                hide-details
              />
              <v-slider
                v-model="offsetRight"
                label="Right"
                :min="0"
                :max="120"
                :step="4"
                hide-details
              />
            </div>
            <div class="affix-scroll">
              <div
                class="affix-bar"
                :style="{
                  top: `${offsetTop}px`,
                  marginLeft: `${offsetLeft}px`,
                  marginRight: `${offsetRight}px`,
                  marginBottom: `${offsetTop}px`,
                }"
              >
                <span class="text-body-2">Affixed header (dynamic offsets)</span>
                <v-btn size="small" variant="outlined">Action</v-btn>
              </div>
              <p v-for="index in 16" :key="index" class="scroll-line">
                Scrollable content {{ index }} · the header stays pinned while this panel scrolls.
              </p>
            </div>
          </DemoSection>

          <DemoSection
            title="Bottom Fixed Affix / 底部固定"
            subtitle="A sticky action bar anchored to the bottom of the scroll area"
          >
            <v-slider
              v-model="offsetBottom"
              label="Offset Bottom"
              :min="0"
              :max="80"
              :step="4"
              hide-details
            />
            <div class="affix-scroll">
              <p v-for="index in 16" :key="index" class="scroll-line">
                Scroll content {{ index }} · the action bar remains visible at the bottom.
              </p>
              <div class="affix-bar affix-bar--bottom" :style="{ bottom: `${offsetBottom}px` }">
                <v-btn color="primary">Primary / 主要</v-btn>
                <v-btn variant="text">Secondary / 次要</v-btn>
              </div>
            </div>
          </DemoSection>

          <DemoSection
            title="Configuration readout"
            subtitle="Current offsets applied by the examples above"
          >
            <div class="offset-readout mono">
              <span>top: {{ offsetTop }}px</span>
              <span>bottom: {{ offsetBottom }}px</span>
              <span>left: {{ offsetLeft }}px</span>
              <span>right: {{ offsetRight }}px</span>
            </div>
            <div class="row">
              <v-btn variant="outlined" size="small" @click="resetOffsets">Reset offsets</v-btn>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Typography -->
      <v-window-item value="typography">
        <div class="demo-grid">
          <DemoSection
            title="Typography 排版示例"
            subtitle="Heading levels and the base type scale"
          >
            <div class="type-scale">
              <div class="text-h3">Typography 排版示例</div>
              <div class="text-h5">Text 文本</div>
              <div class="text-subtitle-1">Subtitle 1 · interface label</div>
              <div class="text-body-1">Body 1 · The quick brown fox jumps over the lazy dog.</div>
              <div class="text-body-2 text-medium-emphasis">
                Body 2 · Secondary supporting copy.
              </div>
              <div class="text-caption text-disabled">Caption · metadata and hints</div>
            </div>
          </DemoSection>

          <DemoSection
            title="Text 文本"
            subtitle="Strong, underline, delete, code and italic inline styles"
          >
            <p class="text-body-1">
              <strong>Strong 加粗</strong> ·
              <span class="text-decoration-underline">Underline 下划线</span> ·
              <span class="text-decoration-line-through">Delete 删除线</span> ·
              <code class="mono code-inline">Code 代码</code> ·
              <em>Italic 斜体</em>
            </p>
            <p class="text-body-2 text-medium-emphasis">
              Inline styles compose freely and inherit the active light or dark theme color.
            </p>
          </DemoSection>

          <DemoSection
            title="copyable / editable 复制·编辑"
            subtitle="Copy to the clipboard and switch a value into edit mode"
          >
            <div class="typo-line">
              <span class="text-body-1">{{ copyableText }}</span>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                size="small"
                aria-label="Copy text"
                @click="copyValue(copyableText)"
              />
            </div>
            <div class="typo-line">
              <v-text-field
                v-if="editing"
                v-model="editableText"
                density="compact"
                hide-details
                autofocus
                @blur="editing = false"
                @keyup.enter="editing = false"
              />
              <span v-else class="text-body-1">{{ editableText }}</span>
              <v-btn
                :icon="editing ? 'mdi-check' : 'mdi-pencil-outline'"
                variant="text"
                size="small"
                :aria-label="editing ? 'Save text' : 'Edit text'"
                @click="editing = !editing"
              />
            </div>
          </DemoSection>

          <DemoSection
            title="ellipsis 省略"
            subtitle="Line clamping with end and middle truncation, plus expand controls"
          >
            <div class="ellipsis-block">
              <p class="text-body-2" :class="{ 'clamp-1': !expanded.long }">{{ longText }}</p>
              <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('long')">
                {{ expanded.long ? 'Collapse' : 'Show more' }}
              </v-btn>
            </div>

            <div class="ellipsis-block">
              <p class="text-body-2" :class="{ 'clamp-2': !expanded.rows }">{{ longText }}</p>
              <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('rows')">
                {{ expanded.rows ? 'Collapse' : 'Expand two rows' }}
              </v-btn>
            </div>

            <div class="ellipsis-block">
              <p class="text-body-2 mono ellipsis-middle">{{ middleTextDisplay }}</p>
              <div class="demo-note">
                Middle truncation keeps the start and the end of the string visible.
              </div>
            </div>
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

.note-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.7;
  color: rgb(var(--v-theme-on-surface-variant));
}

.float-stage {
  position: relative;
  min-height: 230px;
  padding: 16px;
  border: 1px dashed rgba(var(--v-border-color), 0.8);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
}

.float-stage--short {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 180px;
  gap: 16px;
}

.float-fab {
  position: absolute;
  right: 16px;
  bottom: 16px;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 72px;
}

.skeleton-line {
  height: 10px;
  border-radius: 999px;
  background: rgba(128, 128, 140, 0.24);
}

.skeleton-line--title {
  width: 55%;
  height: 16px;
}

.scroll-panel {
  height: 200px;
  overflow-y: auto;
  padding-right: 56px;
}

.scroll-line {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.6;
  color: rgb(var(--v-theme-on-surface-variant));
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.affix-scroll {
  position: relative;
  height: 240px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), 0.7);
  border-radius: 10px;
}

.affix-bar {
  position: sticky;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-border-color), 0.8);
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
}

.affix-bar--bottom {
  margin-top: 12px;
  justify-content: flex-start;
}

.offset-readout {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.type-scale {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.code-inline {
  padding: 2px 5px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface-variant));
}

.typo-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
}

.typo-line .text-body-1 {
  word-break: break-word;
}

.ellipsis-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), 0.6);
}

.ellipsis-block:first-child {
  padding-top: 0;
  border-top: none;
}

.clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ellipsis-middle {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media (max-width: 720px) {
  .control-grid {
    grid-template-columns: 1fr;
  }
}
</style>
