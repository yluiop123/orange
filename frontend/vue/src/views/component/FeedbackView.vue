<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Anchor } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const ui = useUiStore()
const title = usePageTitle('page.title.component')
const tab = ref('alert')

/* alert */
const alertVisible = ref(true)
const warningVisible = ref(true)

/* drawer */
type DrawerMode = 'basic' | 'loading' | 'error'
type DrawerLocation = 'top' | 'bottom' | 'left' | 'right'
const drawerOpen = ref(false)
const drawerLocation = ref<DrawerLocation>('right')
const drawerMode = ref<DrawerMode>('basic')
const drawerLoading = ref(false)
const drawerTitle = computed(() => {
  if (drawerMode.value === 'error') return 'Error / 错误'
  if (drawerMode.value === 'loading') return 'Processing / 处理中'
  return 'Details / 详情'
})
const drawerSubtitle = computed(() => {
  if (drawerMode.value === 'error') return 'An error occurred while loading the data.'
  if (drawerMode.value === 'loading') return 'Actions are disabled while the task runs.'
  return `Sliding from the ${drawerLocation.value} edge.`
})
const drawerDirections: Array<{ value: DrawerLocation; label: string; icon: string }> = [
  { value: 'top', label: 'Top', icon: 'mdi-arrow-up' },
  { value: 'bottom', label: 'Bottom', icon: 'mdi-arrow-down' },
  { value: 'left', label: 'Left', icon: 'mdi-arrow-left' },
  { value: 'right', label: 'Right', icon: 'mdi-arrow-right' },
]

function openDrawer(location: DrawerLocation, mode: DrawerMode = 'basic') {
  drawerLocation.value = location
  drawerMode.value = mode
  drawerLoading.value = mode === 'loading'
  drawerOpen.value = true
  if (mode === 'loading') simulateDrawerTask()
}

function simulateDrawerTask() {
  drawerLoading.value = true
  window.setTimeout(() => (drawerLoading.value = false), 1800)
}

/* sonner / toasts */
type ToastColor = 'success' | 'error' | 'warning' | 'info'
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<ToastColor>('info')
const snackbarLocation = ref<Anchor>('top right')
const toastLoading = ref(false)
const toastPositions: Array<{ label: string; value: Anchor }> = [
  { label: 'Top right', value: 'top right' },
  { label: 'Top center', value: 'top center' },
  { label: 'Top left', value: 'top left' },
  { label: 'Bottom right', value: 'bottom right' },
  { label: 'Bottom center', value: 'bottom center' },
  { label: 'Bottom left', value: 'bottom left' },
]

function showToast(text: string, color: ToastColor = 'info', location: Anchor = snackbarLocation.value) {
  snackbarText.value = text
  snackbarColor.value = color
  snackbarLocation.value = location
  snackbar.value = true
}

function runPromiseToast() {
  toastLoading.value = true
  showToast('Saving... / 保存中', 'info')
  window.setTimeout(() => {
    toastLoading.value = false
    showToast('Saved! / 已保存', 'success')
  }, 1800)
}

/* alert dialog */
const deleteDialog = ref(false)
const signOutDialog = ref(false)

function confirmDelete() {
  deleteDialog.value = false
  ui.notify('Item deleted', 'success')
}

function confirmSignOut() {
  signOutDialog.value = false
  ui.notify('Signed out', 'info')
}

/* dialog */
const dialogOpen = ref(false)
const largeDialogOpen = ref(false)
const overlayOpen = ref(false)
const dialogLines = Array.from({ length: 30 }, (_, index) => index + 1)

/* progress */
const progress = ref(40)

/* result */
const resultOk = ref(true)

/* skeleton */
const skeletonLoading = ref(true)

/* spinner */
const spinnerLoading = ref(true)

/* watermark */
const watermarkText = ref('Demo Watermark / 水印示例')
const watermarkRotation = ref(-30)
const watermarkFontSize = ref(48)
const watermarkOpacity = ref(0.12)
const watermarkStyle = computed(() => ({
  transform: `rotate(${watermarkRotation.value}deg)`,
  opacity: String(watermarkOpacity.value),
  fontSize: `${watermarkFontSize.value}px`,
}))

function resetWatermark() {
  watermarkText.value = 'Demo Watermark / 水印示例'
  watermarkRotation.value = -30
  watermarkFontSize.value = 48
  watermarkOpacity.value = 0.12
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.feedback')" />

    <v-tabs v-model="tab" color="primary">
      <v-tab value="alert">Alert</v-tab>
      <v-tab value="drawer">Drawer</v-tab>
      <v-tab value="sonner">Sonner</v-tab>
      <v-tab value="alert-dialog">Alert Dialog</v-tab>
      <v-tab value="dialog">Dialog</v-tab>
      <v-tab value="progress">Progress</v-tab>
      <v-tab value="result">Result</v-tab>
      <v-tab value="skeleton">Skeleton</v-tab>
      <v-tab value="spinner">Spinner</v-tab>
      <v-tab value="watermark">Watermark</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="feedback-window">
      <!-- Alert -->
      <v-window-item value="alert">
        <DemoSection title="Basic usage" subtitle="Important information that needs attention">
          <v-alert type="info" variant="tonal" title="Heads up!" text="You can add components to your app using the CLI." />
        </DemoSection>

        <DemoSection title="Types" subtitle="Information, error, success and warning">
          <div class="stack">
            <v-alert
              type="info"
              variant="tonal"
              title="Information / 信息"
              text="This is an informational message / 这是一条信息提示消息"
            />
            <v-alert
              type="error"
              variant="tonal"
              title="Error / 错误"
              text="Your session has expired. Please log in again. / 您的会话已过期，请重新登录。"
            />
            <v-alert
              type="success"
              variant="tonal"
              title="Success / 成功"
              text="Your changes have been saved successfully. / 您的更改已成功保存。"
            />
            <v-alert
              type="warning"
              variant="tonal"
              title="Warning / 警告"
              text="This action cannot be undone. Please proceed with caution. / 此操作无法撤消，请谨慎操作。"
            />
          </div>
        </DemoSection>

        <DemoSection title="Closable alerts" subtitle="Dismiss and restore">
          <v-alert
            v-model="alertVisible"
            type="info"
            variant="outlined"
            title="Notice / 注意"
            text="This alert can be closed with the close icon. / 此警报可通过单击关闭按钮关闭。"
            closable
          />
          <v-alert
            v-model="warningVisible"
            type="warning"
            variant="outlined"
            title="Warning / 警告"
            text="Critical system warning. Please take immediate action. / 系统严重警告，请立即采取行动。"
            closable
          />
          <div class="row">
            <v-btn
              variant="text"
              size="small"
              prepend-icon="mdi-restore"
              :disabled="alertVisible && warningVisible"
              @click="((alertVisible = true), (warningVisible = true))"
            >
              Restore alerts
            </v-btn>
          </div>
        </DemoSection>

        <DemoSection title="Long text" subtitle="Alerts grow with their content">
          <v-alert type="info" variant="flat" title="Detailed information / 详细信息">
            This is a longer description that demonstrates how alerts handle extended content.
            Alerts can contain multiple lines of text, and they adapt to the content height. 这是一个
            较长的描述，演示了警报如何处理扩展内容。警报可以包含多行文本，并且它们会适应内容高度。
          </v-alert>
        </DemoSection>
      </v-window-item>

      <!-- Drawer -->
      <v-window-item value="drawer">
        <DemoSection title="Basic drawer" subtitle="Header, content and footer actions">
          <div class="row">
            <v-btn color="primary" prepend-icon="mdi-dock-right" @click="openDrawer('right')">
              Open drawer
            </v-btn>
            <span class="demo-note">Slides in from the right edge with a temporary overlay.</span>
          </div>
        </DemoSection>

        <DemoSection title="Directions" subtitle="Drawers can slide from any edge">
          <div class="row">
            <v-btn
              v-for="direction in drawerDirections"
              :key="direction.value"
              :prepend-icon="direction.icon"
              variant="outlined"
              @click="openDrawer(direction.value)"
            >
              {{ direction.label }}
            </v-btn>
          </div>
          <p class="demo-note">Each button reuses the same drawer instance with a new location.</p>
        </DemoSection>

        <DemoSection title="Loading & error states" subtitle="Disabled actions and inline feedback">
          <div class="row">
            <v-btn color="primary" @click="openDrawer('right', 'loading')">
              Open with loading
            </v-btn>
            <v-btn color="error" variant="tonal" @click="openDrawer('right', 'error')">
              Open with error
            </v-btn>
          </div>
          <p class="demo-note">
            Loading disables the footer actions; the error state keeps the confirm action disabled.
          </p>
        </DemoSection>
      </v-window-item>

      <!-- Sonner -->
      <v-window-item value="sonner">
        <DemoSection title="Basic notifications" subtitle="Transient messages at the current position">
          <div class="row">
            <v-btn variant="tonal" @click="showToast('Hello from the toast / 来自提示的消息')">
              Basic
            </v-btn>
            <v-btn color="success" @click="showToast('Saved successfully / 保存成功', 'success')">
              Success
            </v-btn>
            <v-btn color="error" @click="showToast('Something went wrong / 出错了', 'error')">
              Error
            </v-btn>
            <v-btn color="warning" @click="showToast('Check the filters / 请检查筛选条件', 'warning')">
              Warning
            </v-btn>
          </div>
        </DemoSection>

        <DemoSection title="Promise toast" subtitle="Reflect async status from pending to done">
          <div class="row">
            <v-btn
              color="primary"
              :loading="toastLoading"
              prepend-icon="mdi-progress-clock"
              @click="runPromiseToast"
            >
              {{ toastLoading ? 'Working...' : 'Run promise' }}
            </v-btn>
            <span class="demo-note">Shows "Saving..." then "Saved!" after 1.8 seconds.</span>
          </div>
        </DemoSection>

        <DemoSection title="Placement" subtitle="Show a toast at each anchor">
          <div class="row">
            <v-btn
              v-for="position in toastPositions"
              :key="position.value"
              variant="outlined"
              size="small"
              @click="showToast(position.label + ' / ' + position.value, 'info', position.value)"
            >
              {{ position.label }}
            </v-btn>
          </div>
          <p class="demo-note">Current position: {{ snackbarLocation }}</p>
        </DemoSection>

        <v-snackbar
          v-model="snackbar"
          :color="snackbarColor"
          :location="snackbarLocation"
          :timeout="2600"
          rounded="lg"
          elevation="6"
        >
          {{ snackbarText }}
        </v-snackbar>
      </v-window-item>

      <!-- Alert Dialog -->
      <v-window-item value="alert-dialog">
        <DemoSection title="Destructive confirmation" subtitle="Requires an explicit choice">
          <div class="row">
            <v-btn color="error" variant="tonal" @click="deleteDialog = true">Delete item</v-btn>
            <span class="demo-note">The dialog stays open until confirm or cancel is pressed.</span>
          </div>

          <v-dialog v-model="deleteDialog" max-width="440" persistent>
            <v-card>
              <v-card-item>
                <template #prepend>
                  <v-avatar color="error" variant="tonal" size="40">
                    <v-icon>mdi-alert-outline</v-icon>
                  </v-avatar>
                </template>
                <v-card-title>Are you sure?</v-card-title>
                <v-card-subtitle>This action cannot be undone.</v-card-subtitle>
              </v-card-item>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="outlined" @click="deleteDialog = false">Cancel</v-btn>
                <v-btn color="error" @click="confirmDelete">Confirm</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </DemoSection>

        <DemoSection title="Sign out" subtitle="A second confirmation flow">
          <div class="row">
            <v-btn variant="outlined" @click="signOutDialog = true">Sign out</v-btn>
          </div>

          <v-dialog v-model="signOutDialog" max-width="440" persistent>
            <v-card>
              <v-card-item title="Sign out?" subtitle="You will need to sign in again to continue." />
              <v-card-actions>
                <v-spacer />
                <v-btn variant="outlined" @click="signOutDialog = false">Stay</v-btn>
                <v-btn color="error" @click="confirmSignOut">Sign out</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </DemoSection>

        <DemoSection title="Accessibility" subtitle="Focus and keyboard behaviour">
          <p class="text-body-2">
            Alert dialogs trap focus and require explicit confirmation. Keyboard users can press
            Enter to confirm or Escape to cancel. Destructive actions always ask first.
          </p>
        </DemoSection>
      </v-window-item>

      <!-- Dialog -->
      <v-window-item value="dialog">
        <DemoSection title="Basic dialog" subtitle="Centered modal with short content">
          <div class="row">
            <v-btn color="primary" @click="dialogOpen = true">Open dialog</v-btn>
          </div>

          <v-dialog v-model="dialogOpen" max-width="500">
            <v-card title="Centered dialog" subtitle="Default centered modal.">
              <v-card-text>
                A modal surface for forms, details and confirmations. Press Escape or click outside
                to dismiss.
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="outlined" @click="dialogOpen = false">Close</v-btn>
                <v-btn
                  color="primary"
                  @click="((dialogOpen = false), ui.notify('Confirmed', 'success'))"
                >
                  Confirm
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </DemoSection>

        <DemoSection title="Large scrollable dialog" subtitle="For complex forms or content">
          <div class="row">
            <v-btn variant="outlined" @click="largeDialogOpen = true">Open large dialog</v-btn>
          </div>

          <v-dialog v-model="largeDialogOpen" max-width="760" scrollable>
            <v-card>
              <v-card-title>Large dialog</v-card-title>
              <v-card-subtitle>Use for more complex forms or content.</v-card-subtitle>
              <v-divider />
              <v-card-text class="scroll-body">
                <p class="text-body-2">Long scrollable content:</p>
                <p v-for="line in dialogLines" :key="line" class="demo-note">
                  Line {{ line }} · the dialog body keeps its own scroll position.
                </p>
              </v-card-text>
              <v-divider />
              <v-card-actions>
                <v-spacer />
                <v-btn variant="outlined" @click="largeDialogOpen = false">Close</v-btn>
                <v-btn
                  color="primary"
                  @click="((largeDialogOpen = false), ui.notify('Saved', 'success'))"
                >
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </DemoSection>

        <DemoSection title="Overlay loading" subtitle="Blocking overlay with progress">
          <div class="row">
            <v-btn variant="outlined" prepend-icon="mdi-progress-upload" @click="overlayOpen = true">
              Show overlay
            </v-btn>
            <span class="demo-note">A contained overlay imitates a long-running request.</span>
          </div>

          <v-overlay v-model="overlayOpen" class="align-center justify-center" persistent>
            <v-card width="320">
              <v-card-title>Working…</v-card-title>
              <v-card-text>
                <v-progress-linear indeterminate color="primary" />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="overlayOpen = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
        </DemoSection>
      </v-window-item>

      <!-- Progress -->
      <v-window-item value="progress">
        <DemoSection title="Determinate progress" subtitle="Bound to local state">
          <v-progress-linear :model-value="progress" color="primary" height="12" rounded>
            <template #default="{ value }">
              <strong>{{ Math.ceil(value) }}%</strong>
            </template>
          </v-progress-linear>
          <v-slider v-model="progress" :min="0" :max="100" hide-details color="primary" />
          <div class="row">
            <v-btn variant="outlined" size="small" @click="progress = Math.max(0, progress - 10)">
              -10
            </v-btn>
            <v-btn variant="outlined" size="small" @click="progress = Math.min(100, progress + 10)">
              +10
            </v-btn>
            <v-btn variant="text" size="small" @click="progress = 0">Reset</v-btn>
            <span class="demo-note">{{ progress }} / 100</span>
          </div>
        </DemoSection>

        <DemoSection title="Indeterminate progress" subtitle="Unknown-length tasks">
          <v-progress-linear indeterminate color="info" height="10" rounded />
          <v-progress-linear indeterminate color="warning" height="4" />
          <p class="demo-note">Use an animated bar when the total amount of work is unknown.</p>
        </DemoSection>

        <DemoSection title="Circular progress" subtitle="Determinate and indeterminate rings">
          <div class="row">
            <v-progress-circular :model-value="progress" color="primary" size="72" width="7">
              {{ progress }}%
            </v-progress-circular>
            <v-progress-circular indeterminate color="warning" size="52" width="5" />
            <v-progress-circular indeterminate color="success" size="36" width="4" />
            <span class="demo-note">The ring mirrors the determinate slider above.</span>
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Result -->
      <v-window-item value="result">
        <DemoSection title="Result state" subtitle="Toggle between success and failure">
          <div class="result-panel">
            <v-avatar :color="resultOk ? 'success' : 'error'" variant="tonal" size="64">
              <v-icon size="36">{{ resultOk ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}</v-icon>
            </v-avatar>
            <div class="result-body">
              <div class="result-title">{{ resultOk ? 'Success / 成功' : 'Failed / 失败' }}</div>
              <p class="demo-note">
                {{
                  resultOk
                    ? 'Your operation completed successfully.'
                    : 'There was an error processing your request.'
                }}
              </p>
              <details v-if="!resultOk" class="result-details">
                <summary>View details</summary>
                <pre>Error: Something went wrong while saving.</pre>
              </details>
              <div class="row mt-3">
                <v-btn color="primary" @click="ui.notify('Back to dashboard', 'info')">
                  Back home
                </v-btn>
                <v-btn variant="outlined" @click="resultOk = !resultOk">
                  {{ resultOk ? 'Simulate error' : 'Simulate success' }}
                </v-btn>
              </div>
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Status variants" subtitle="Success, warning and error results">
          <div class="demo-grid demo-grid--3">
            <v-card v-for="state in [
              { icon: 'mdi-check-circle', color: 'success', title: 'Payment complete', text: 'Your invoice was paid.' },
              { icon: 'mdi-alert-circle', color: 'warning', title: 'Review required', text: 'One field needs attention.' },
              { icon: 'mdi-close-circle', color: 'error', title: 'Upload failed', text: 'The file exceeds the limit.' },
            ]" :key="state.title" variant="outlined">
              <v-card-text class="result-mini">
                <v-icon :color="state.color" size="32">{{ state.icon }}</v-icon>
                <div class="timeline-title">{{ state.title }}</div>
                <div class="demo-note">{{ state.text }}</div>
              </v-card-text>
            </v-card>
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Skeleton -->
      <v-window-item value="skeleton">
        <DemoSection title="Loading toggle" subtitle="Swap placeholders for real content">
          <div class="row">
            <v-btn
              color="primary"
              :prepend-icon="skeletonLoading ? 'mdi-eye-outline' : 'mdi-reload'"
              @click="skeletonLoading = !skeletonLoading"
            >
              {{ skeletonLoading ? 'Show content' : 'Show skeletons' }}
            </v-btn>
            <span class="demo-note">{{ skeletonLoading ? 'Loading placeholders' : 'Content loaded' }}</span>
          </div>
        </DemoSection>

        <DemoSection title="Profile, article and list" subtitle="Three common placeholder shapes">
          <div class="demo-grid demo-grid--3">
            <v-card variant="outlined">
              <v-card-text>
                <template v-if="skeletonLoading">
                  <v-skeleton-loader type="avatar" class="mb-2" />
                  <v-skeleton-loader type="text" />
                  <v-skeleton-loader type="text" width="70%" />
                </template>
                <div v-else class="row">
                  <v-avatar color="primary" size="44"><span>JD</span></v-avatar>
                  <div>
                    <div class="timeline-title">John Doe</div>
                    <div class="demo-note">Product designer</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <v-card variant="outlined">
              <v-card-text>
                <v-skeleton-loader v-if="skeletonLoading" type="heading, text, text" />
                <template v-else>
                  <div class="result-title">Loaded title</div>
                  <p class="demo-note">Content is loaded and ready to read.</p>
                </template>
              </v-card-text>
            </v-card>

            <v-card variant="outlined">
              <v-card-text>
                <v-skeleton-loader v-if="skeletonLoading" type="list-item-two-line@3" />
                <v-list v-else density="compact">
                  <v-list-item prepend-icon="mdi-account-outline" title="Item 1" />
                  <v-list-item prepend-icon="mdi-account-outline" title="Item 2" />
                  <v-list-item prepend-icon="mdi-account-outline" title="Item 3" />
                </v-list>
              </v-card-text>
            </v-card>
          </div>
        </DemoSection>

        <DemoSection title="Card grid skeleton" subtitle="Placeholder cards while data loads">
          <v-row dense>
            <v-col v-for="index in 3" :key="index" cols="12" sm="4">
              <v-card v-if="skeletonLoading" variant="outlined">
                <v-skeleton-loader type="image" />
                <v-card-text>
                  <v-skeleton-loader type="heading" />
                  <v-skeleton-loader type="text" />
                  <v-skeleton-loader type="text" width="60%" />
                </v-card-text>
              </v-card>
              <v-card v-else variant="outlined">
                <v-card-text class="center-stack">
                  <v-avatar :color="index === 1 ? 'primary' : index === 2 ? 'success' : 'secondary'" size="44">
                    <v-icon>mdi-package-variant-closed</v-icon>
                  </v-avatar>
                  <div class="timeline-title">Loaded card {{ index }}</div>
                  <div class="demo-note">A complete card with real content.</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </DemoSection>
      </v-window-item>

      <!-- Spinner -->
      <v-window-item value="spinner">
        <DemoSection title="Sizes" subtitle="Small, default and large indicators">
          <div class="row center-row spinner-stage">
            <div v-for="size in [24, 40, 64]" :key="size" class="spinner-item">
              <v-progress-circular v-if="spinnerLoading" indeterminate color="primary" :size="size" :width="size / 10" />
              <v-icon v-else color="success" :size="size">mdi-check-circle-outline</v-icon>
              <span class="demo-note">{{ size === 24 ? 'Small' : size === 40 ? 'Default' : 'Large' }}</span>
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Inline in button" subtitle="Loading state with a label">
          <div class="row">
            <v-btn
              color="primary"
              :loading="spinnerLoading"
              @click="spinnerLoading = !spinnerLoading"
            >
              {{ spinnerLoading ? 'Loading...' : 'Click to load' }}
            </v-btn>
            <v-btn variant="outlined" size="small" @click="spinnerLoading = !spinnerLoading">
              Toggle loading
            </v-btn>
          </div>
          <p class="demo-note">The spinner replaces the action label while the task runs.</p>
        </DemoSection>

        <DemoSection title="Colours" subtitle="Spinner colour follows the semantic state">
          <div class="row">
            <v-progress-circular indeterminate color="primary" size="44" width="4" />
            <v-progress-circular indeterminate color="success" size="44" width="4" />
            <v-progress-circular indeterminate color="warning" size="44" width="4" />
            <v-progress-circular indeterminate color="error" size="44" width="4" />
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Watermark -->
      <v-window-item value="watermark">
        <DemoSection title="Basic watermark" subtitle="Adjust text, size, rotation and opacity">
          <div class="watermark-stage">
            <div class="watermark-layer" aria-hidden="true">
              <span :style="watermarkStyle">{{ watermarkText }}</span>
            </div>
            <div class="watermark-content">
              <div class="timeline-title">Protected content</div>
              <p class="demo-note">
                Your content goes here. The watermark appears behind the content and never
                intercepts pointer events.
              </p>
            </div>
          </div>

          <v-row dense class="mt-2">
            <v-col cols="12" md="4">
              <v-text-field v-model="watermarkText" label="Watermark text" density="compact" hide-details />
            </v-col>
            <v-col cols="12" md="2">
              <v-btn variant="outlined" block @click="resetWatermark">Reset</v-btn>
            </v-col>
            <v-col cols="12" md="3">
              <div class="field-label">Rotation: {{ watermarkRotation }}°</div>
              <v-slider
                v-model="watermarkRotation"
                :min="-90"
                :max="90"
                hide-details
                density="compact"
                color="primary"
              />
            </v-col>
            <v-col cols="12" md="3">
              <div class="field-label">Font size: {{ watermarkFontSize }}px</div>
              <v-slider
                v-model="watermarkFontSize"
                :min="24"
                :max="120"
                hide-details
                density="compact"
                color="primary"
              />
            </v-col>
            <v-col cols="12" md="4">
              <div class="field-label">Opacity: {{ watermarkOpacity.toFixed(2) }}</div>
              <v-slider
                v-model="watermarkOpacity"
                :min="0"
                :max="0.5"
                :step="0.01"
                hide-details
                density="compact"
                color="primary"
              />
            </v-col>
          </v-row>
        </DemoSection>

        <DemoSection title="Tiled watermark" subtitle="Repeated diagonal pattern">
          <div class="watermark-stage tiled">
            <div class="watermark-grid" aria-hidden="true">
              <span v-for="index in 12" :key="index" :style="watermarkStyle">
                {{ watermarkText }}
              </span>
            </div>
            <div class="watermark-content">
              <div class="timeline-title">Dense coverage</div>
              <p class="demo-note">
                A repeated layer is useful for marking screenshots or internal documents. The text
                stays decorative and out of the accessibility tree.
              </p>
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Watermark with card content" subtitle="Foreground remains fully readable">
          <v-card variant="outlined" class="watermark-card">
            <div class="watermark-layer" aria-hidden="true">
              <span :style="watermarkStyle">{{ watermarkText }}</span>
            </div>
            <v-card-text class="watermark-content">
              <div class="timeline-title">Quarterly report</div>
              <p class="demo-note">
                Revenue grew 12% quarter over quarter, driven by the new console and the expanded
                permission catalogue.
              </p>
              <v-chip size="small" color="primary" variant="tonal">Internal</v-chip>
            </v-card-text>
          </v-card>
        </DemoSection>
      </v-window-item>
    </v-window>

    <v-navigation-drawer v-model="drawerOpen" temporary :location="drawerLocation" width="360">
      <div class="drawer-head">
        <div>
          <div class="drawer-title">{{ drawerTitle }}</div>
          <div class="demo-note">{{ drawerSubtitle }}</div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          aria-label="Close drawer"
          @click="drawerOpen = false"
        />
      </div>
      <v-divider />
      <div class="drawer-body">
        <v-alert v-if="drawerMode === 'error'" type="error" variant="tonal" density="compact">
          Failed to load details. Please try again.
        </v-alert>
        <template v-else-if="drawerMode === 'loading'">
          <p class="text-body-2">Simulating a short task. Actions stay disabled while it runs.</p>
          <v-skeleton-loader type="list-item-two-line@2" class="mt-4" />
        </template>
        <p v-else class="text-body-2">
          This is the drawer content area. Put forms, profile details or a settings panel here.
        </p>
      </div>
      <div class="drawer-foot">
        <v-btn variant="outlined" :disabled="drawerLoading" @click="drawerOpen = false">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          :loading="drawerLoading"
          :disabled="drawerMode === 'error'"
          @click="drawerMode === 'loading' ? simulateDrawerTask() : (drawerOpen = false)"
        >
          {{ drawerLoading ? 'Processing...' : 'Confirm' }}
        </v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.row.center-row {
  justify-content: center;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-window {
  padding-top: 4px;
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 700;
}

.drawer-body {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.drawer-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid rgb(var(--v-border-color));
}

.scroll-body {
  max-height: 280px;
}

.result-panel {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 18px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
}

.result-body {
  flex: 1;
}

.result-title {
  font-size: 16px;
  font-weight: 700;
}

.result-details {
  margin-top: 8px;
  font-size: 12px;
}

.result-details summary {
  cursor: pointer;
  font-weight: 600;
}

.result-details pre {
  margin: 8px 0 0;
  padding: 8px;
  border-radius: 6px;
  font-size: 11px;
  overflow: auto;
  background: rgb(var(--v-theme-surface));
}

.result-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.center-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.spinner-stage {
  gap: 32px;
  padding: 20px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.spinner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 72px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

.watermark-stage {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  padding: 20px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
}

.watermark-card {
  position: relative;
  overflow: hidden;
}

.watermark-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  user-select: none;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
}

.watermark-content {
  position: relative;
  z-index: 1;
}

.watermark-grid {
  position: absolute;
  inset: -20%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  justify-items: center;
  gap: 24px;
  pointer-events: none;
  user-select: none;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  overflow: hidden;
}

.watermark-grid span {
  display: inline-block;
}
</style>
