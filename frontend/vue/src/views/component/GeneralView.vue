<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const tab = ref('button')
const loading = ref(false)
const showBackTop = ref(false)

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

const ellipsisText = '这是一段很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本很长的文本'.repeat(10)
const middleEllipsisText =
  '这是一段非常非常长的文本示例，用于展示中间省略，仅显示头尾，中间省略号...'.repeat(10)
const expandableText = '这是一段很长的文本，用于测试自定义展开收起文字显示，并高亮显示。'.repeat(20)
const iconExpandText = '这是一段很长的文本，用于测试自定义图标展开收起。'.repeat(20)
const middleTextDisplay = computed(
  () => `${middleEllipsisText.slice(0, 15)}...${middleEllipsisText.slice(-15)}`,
)

let scrollHost: HTMLElement | null = null

function onScroll() {
  showBackTop.value = (scrollHost?.scrollTop ?? 0) > 200
}

onMounted(() => {
  scrollHost = document.querySelector('.v-main')
  scrollHost?.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  scrollHost?.removeEventListener('scroll', onScroll)
})

function scrollToTop() {
  scrollHost?.scrollTo({ top: 0, behavior: 'smooth' })
}

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
</script>

<template>
  <div class="orange-page">
    <v-tabs v-model="tab" color="primary">
      <v-tab value="button">Button</v-tab>
      <v-tab value="floatButton">FloatButton</v-tab>
      <v-tab value="affix">Affix</v-tab>
      <v-tab value="typography">Typography</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Button -->
      <v-window-item value="button">
        <div class="orange-body">
          <h2 class="orange-title">Size 大小</h2>
          <div class="orange-row">
            <v-btn size="small" color="primary">small</v-btn>
            <v-btn color="primary">default</v-btn>
            <v-btn size="large" color="primary">large</v-btn>
            <v-btn color="primary" icon aria-label="Icon button">icon</v-btn>
          </div>

          <h2 class="orange-title">Type 类型</h2>
          <div class="orange-row">
            <v-btn color="primary">Default</v-btn>
            <v-btn color="#155dfc">Primary 主要</v-btn>
            <v-btn variant="flat" color="secondary">Secondary 次要</v-btn>
            <v-btn color="#fb2c36">Destructive 危险</v-btn>
            <v-btn color="#00c950">Success 成功</v-btn>
            <v-btn color="primary">
              <a href="https://example.com" target="_blank" rel="noopener noreferrer">Link 链接</a>
            </v-btn>
          </div>

          <h2 class="orange-title">Variant 变体</h2>
          <div class="orange-row">
            <v-btn color="primary">default</v-btn>
            <v-btn variant="text" color="error" class="orange-destructive-tonal">destructive</v-btn>
            <v-btn variant="outlined">outline</v-btn>
            <v-btn variant="flat" color="secondary">secondary</v-btn>
            <v-btn variant="text">ghost</v-btn>
            <v-btn variant="text" color="primary">Link</v-btn>
          </div>

          <h2 class="orange-title">Status 状态</h2>
          <div class="orange-row">
            <v-btn color="primary">Normal</v-btn>
            <v-btn color="primary" disabled>Disabled</v-btn>
            <v-btn color="primary" :disabled="loading" @click="simulateLoad">
              {{ loading ? 'Loading...' : 'Click to Load' }}
            </v-btn>
          </div>

          <h2 class="orange-title">Icon Button 图标按钮</h2>
          <div class="orange-row">
            <v-btn color="primary" prepend-icon="mdi-coffee-outline">Icon Button</v-btn>
            <v-btn color="#00c950" prepend-icon="mdi-check">Success</v-btn>
          </div>

          <h2 class="orange-title">Square 形状</h2>
          <div class="orange-row">
            <v-btn color="primary" rounded="0">Square</v-btn>
            <v-btn color="primary" rounded="lg">Round</v-btn>
            <v-btn color="primary" rounded="pill">Full Circle</v-btn>
          </div>
        </div>
      </v-window-item>

      <!-- FloatButton -->
      <v-window-item value="floatButton">
        <div class="orange-page-surface">
          <p class="orange-float-copy">页面内容很长，可以滚动。示例展示回到顶部、不同位置与展开方向。</p>

          <v-btn
            v-show="showBackTop"
            class="orange-float"
            style="bottom: 24px; left: 50%; transform: translateX(-50%)"
            color="primary"
            icon="mdi-arrow-up"
            aria-label="Back to top"
            @click="scrollToTop"
          />

          <v-menu location="left center" :offset="12">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                class="orange-float"
                style="top: 50%; right: 24px; transform: translateY(-50%)"
                color="primary"
                icon="mdi-plus"
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
                prepend-icon="mdi-delete-outline"
                title="Delete"
                base-color="error"
                @click="pickAction('Delete')"
              />
            </v-list>
          </v-menu>

          <v-menu location="top end" :offset="12">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                class="orange-float"
                style="bottom: 24px; right: 24px"
                color="primary"
                icon="mdi-plus"
                aria-label="Expand upward"
              />
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil-outline"
                title="Edit"
                @click="pickAction('Edit')"
              />
              <v-list-item
                prepend-icon="mdi-delete-outline"
                title="Delete"
                base-color="error"
                @click="pickAction('Delete')"
              />
            </v-list>
          </v-menu>

          <v-menu location="right center" :offset="12">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                class="orange-float"
                style="top: 50%; left: 24px; transform: translateY(-50%)"
                color="primary"
                icon="mdi-plus"
                aria-label="Expand to the right"
              />
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil-outline"
                title="Edit"
                @click="pickAction('Edit')"
              />
            </v-list>
          </v-menu>

          <div class="orange-notes">
            <h3 class="orange-subtitle">演示说明</h3>
            <ul>
              <li>主按钮支持回到顶部、展开按钮组或自定义点击回调。</li>
              <li>组按钮支持徽章计数与自定义样式。</li>
              <li>按下主按钮或按键 Enter/Space 可展开/收起组，按 Esc 或点击外部可关闭。</li>
            </ul>
          </div>
        </div>
      </v-window-item>

      <!-- Affix -->
      <v-window-item value="affix">
        <div class="orange-page-surface">
          <div class="orange-affix-container">
            <h1 class="orange-hero-title">Affix / 固钉</h1>

            <section class="orange-affix-card">
              <h2 class="orange-affix-title">Top Affix / 顶部固钉</h2>
              <p class="orange-muted">示例：顶部固钉，支持顶部与水平偏移。</p>

              <div
                class="orange-affix-header"
                :style="{
                  top: `${offsetTop}px`,
                  marginLeft: `${offsetLeft}px`,
                  marginRight: `${offsetRight}px`,
                }"
              >
                <span>Affixed header (dynamic offsets)</span>
                <v-btn size="small" variant="outlined">Action</v-btn>
              </div>

              <div class="orange-controls">
                <label>Offset Top</label>
                <v-slider
                  v-model="offsetTop"
                  :min="0"
                  :max="200"
                  hide-details
                  style="max-width: 8rem"
                />
                <span class="orange-muted">{{ offsetTop }}px</span>
                <label>Left</label>
                <v-text-field
                  v-model.number="offsetLeft"
                  type="number"
                  density="compact"
                  hide-details
                  style="max-width: 5rem"
                />
                <label>Right</label>
                <v-text-field
                  v-model.number="offsetRight"
                  type="number"
                  density="compact"
                  hide-details
                  style="max-width: 5rem"
                />
              </div>
            </section>

            <section class="orange-affix-card">
              <h2 class="orange-affix-title">Bottom Fixed Affix / 底部固定</h2>
              <p class="orange-muted">
                示例：底部固定（滚动到指定位置后固定），可设置底部与水平偏移。
              </p>

              <div class="orange-affix-scroll">
                <div v-for="index in 24" :key="index" class="orange-scroll-line">
                  Scroll content {{ index }}
                </div>
                <div
                  class="orange-affix-footer"
                  :style="{
                    bottom: `${offsetBottom}px`,
                    marginLeft: `${offsetLeft}px`,
                    marginRight: `${offsetRight}px`,
                  }"
                >
                  <v-btn color="primary">Primary / 主要</v-btn>
                  <v-btn variant="text">Secondary / 次要</v-btn>
                </div>
              </div>

              <div class="orange-controls">
                <label>Offset Bottom</label>
                <v-slider
                  v-model="offsetBottom"
                  :min="0"
                  :max="120"
                  hide-details
                  style="max-width: 8rem"
                />
                <span class="orange-muted">{{ offsetBottom }}px</span>
                <label>Left (px)</label>
                <v-text-field
                  v-model.number="offsetLeft"
                  type="number"
                  density="compact"
                  hide-details
                  style="max-width: 6rem"
                />
                <label>Right (px)</label>
                <v-text-field
                  v-model.number="offsetRight"
                  type="number"
                  density="compact"
                  hide-details
                  style="max-width: 6rem"
                />
              </div>
            </section>
          </div>
        </div>
      </v-window-item>

      <!-- Typography -->
      <v-window-item value="typography">
        <div class="orange-typography">
          <h1 class="orange-type-h1">Typography 排版示例</h1>
          <br />
          <h2 class="orange-type-h2">Text 文本</h2>
          <p class="orange-type-p">
            <strong>Strong 加粗</strong> ·
            <span style="text-decoration: underline">Underline 下划线</span> ·
            <span style="text-decoration: line-through">Delete 删除线</span> ·
            <code class="code-inline">Code 代码</code> ·
            <em>Italic 斜体</em>
          </p>
          <br />
          <h2 class="orange-type-h2">copyable/editable 复制/编辑</h2>
          <p class="orange-type-p orange-type-text">
            {{ copyableText }}
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="x-small"
              class="orange-icon-small"
              aria-label="Copy text"
              @click="copyValue(copyableText)"
            />
          </p>
          <p class="orange-type-p orange-type-text">
            Copyable withIcon 自定义图标复制
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="x-small"
              class="orange-icon-small"
              aria-label="Copy text"
              @click="copyValue('Copyable withIcon 自定义图标复制')"
            />
          </p>
          <p class="orange-type-p orange-type-text">
            <v-text-field
              v-if="editing"
              v-model="editableText"
              density="compact"
              hide-details
              autofocus
              style="max-width: 14rem"
              @blur="editing = false"
              @keyup.enter="editing = false"
            />
            <template v-else>{{ editableText }}</template>
            <v-btn
              :icon="editing ? 'mdi-check' : 'mdi-pencil-outline'"
              variant="text"
              size="x-small"
              class="orange-icon-small"
              :aria-label="editing ? 'Save text' : 'Edit text'"
              @click="editing = !editing"
            />
          </p>
          <br />
          <h2 class="orange-type-h2">ellipsis 省略</h2>
          <p class="orange-type-p">
            <span :class="{ 'clamp-1': !expanded.e1 }">{{ ellipsisText }}</span>
          </p>
          <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('e1')">
            {{ expanded.e1 ? '收起' : '展开' }}
          </v-btn>
          <p class="orange-type-p">
            <span :class="{ 'clamp-2': !expanded.e2 }">{{ ellipsisText }}</span>
          </p>
          <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('e2')">
            {{ expanded.e2 ? '收起' : '展开' }}
          </v-btn>
          <p class="orange-type-p">
            <span :class="{ 'clamp-1': !expanded.e3 }">
              {{ expanded.e3 ? middleEllipsisText : middleTextDisplay }}
            </span>
          </p>
          <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('e3')">
            {{ expanded.e3 ? '收起' : '展开' }}
          </v-btn>
          <p class="orange-type-p">
            <span :class="{ 'clamp-1': !expanded.e4 }">{{ expandableText }}</span>
          </p>
          <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('e4')">
            {{ expanded.e4 ? '收起全文' : '显示更多' }}
          </v-btn>
          <p class="orange-type-p">
            <span :class="{ 'clamp-2': !expanded.e5 }">{{ iconExpandText }}</span>
          </p>
          <v-btn variant="text" size="small" color="primary" @click="toggleExpanded('e5')">
            {{ expanded.e5 ? '收起' : '展开' }}
          </v-btn>
        </div>
      </v-window-item>
    </v-window>

    <v-snackbar v-model="snackbar" :timeout="2200" location="bottom">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.code-inline {
  padding: 2px 5px;
  border-radius: 4px;
  background: rgb(var(--v-theme-surface-variant));
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
</style>
