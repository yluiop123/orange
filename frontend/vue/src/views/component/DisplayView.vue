<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')
const tab = ref('avatar')

const svg = (from: string, to: string, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" fill="white" font-family="sans-serif" font-size="34" font-weight="700">${label}</text></svg>`,
  )}`

const images = [
  svg('#f97316', '#f59e0b', 'ORANGE'),
  svg('#0ea5e9', '#22d3ee', 'VUE'),
  svg('#16a34a', '#84cc16', 'VUETIFY'),
]
const avatarImages = [
  svg('#f97316', '#f59e0b', 'CN'),
  svg('#6366f1', '#a855f7', 'RU'),
  svg('#0ea5e9', '#22d3ee', 'JD'),
]

/* calendar */
const today = new Date()
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
const todayIso = isoDate(today)
const dayFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const fmtDate = (value: string | null | undefined) =>
  value ? dayFormatter.format(new Date(`${value}T00:00:00`)) : 'No date selected'
const singleDate = ref<string | null>(todayIso)
const fromDate = ref<string | null>(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)))
const toDate = ref<string | null>(isoDate(new Date(today.getFullYear(), today.getMonth(), 12)))
const rangeDays = computed(() => {
  if (!fromDate.value || !toDate.value) return 0
  const from = new Date(`${fromDate.value}T00:00:00`).getTime()
  const to = new Date(`${toDate.value}T00:00:00`).getTime()
  return Math.round(Math.abs(to - from) / 86_400_000) + 1
})
const allowedFromToday = (value: unknown) => String(value) >= todayIso
const futureDate = ref<string | null>(todayIso)
const multipleDates = ref<string[]>([todayIso])

/* card */
const projectName = ref('')
const projectDescription = ref('')
const acceptTerms = ref(true)

/* carousel */
const numberedSlides = [1, 2, 3, 4, 5]
const captionSlides = [
  {
    title: 'Beautiful landscape',
    text: 'Enjoy the view of mountains and valleys.',
    background: 'linear-gradient(135deg, #16a34a 0%, #0284c7 100%)',
  },
  {
    title: 'Ocean waves',
    text: 'Feel the calmness of the ocean.',
    background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
  },
  {
    title: 'City skyline',
    text: 'Experience urban life at its finest.',
    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  },
  {
    title: 'Forest path',
    text: "Discover nature's secret trails.",
    background: 'linear-gradient(135deg, #15803d 0%, #65a30d 100%)',
  },
]
const basicSlide = ref(0)
const captionSlide = ref(0)

/* accordion */
const singlePanel = ref<number | undefined>(0)
const multiPanels = ref([0, 2])

/* popover */
const preferences = ref({
  email: true,
  push: false,
  autoSave: true,
  shortcuts: false,
  analytics: true,
})

/* qrcode */
type QrCell = { x: number; y: number }
const finderOrigins = [
  { x: 0, y: 0 },
  { x: 14, y: 0 },
  { x: 0, y: 14 },
]

function buildQr(value: string): QrCell[] {
  const size = 21
  const cells: QrCell[] = []
  let seed = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    seed ^= value.charCodeAt(i)
    seed = Math.imul(seed, 16777619)
  }
  const next = () => {
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    return (seed >>> 0) / 4_294_967_296
  }
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (inFinder(x, y) || x === 6 || y === 6) continue
      if (next() > 0.5) cells.push({ x, y })
    }
  }
  return cells
}

const qrValue = ref('https://example.com')
const qrSize = ref(140)
const qrFg = ref('#111827')
const qrBg = ref('#ffffff')
const copyLabel = ref('Copy URL')
const qrCells = computed(() => buildQr(qrValue.value))
const presetQrCells = buildQr('https://example.com')
const qrColorPresets = [
  { title: 'Red', subtitle: 'Red foreground', fg: '#ef4444', bg: '#ffffff' },
  { title: 'Blue', subtitle: 'Blue foreground', fg: '#3b82f6', bg: '#ffffff' },
  { title: 'Green', subtitle: 'Green foreground', fg: '#10b981', bg: '#ffffff' },
  { title: 'Dark', subtitle: 'White on black', fg: '#ffffff', bg: '#000000' },
  { title: 'Warm', subtitle: 'Black on yellow', fg: '#111827', bg: '#fef3c7' },
]
const qrSizePresets = [
  { label: 'Small', size: 64 },
  { label: 'Medium', size: 128 },
  { label: 'Large', size: 200 },
  { label: 'Extra large', size: 300 },
]

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(qrValue.value)
    copyLabel.value = 'Copied'
  } catch {
    copyLabel.value = 'Copy failed'
  }
  window.setTimeout(() => (copyLabel.value = 'Copy URL'), 1500)
}

/* segmented */
const segmentOptions = [
  { value: 'day', label: 'Day/日' },
  { value: 'week', label: 'Week/周' },
  { value: 'month', label: 'Month/月' },
]
const bilingualOptions = [
  { value: 'name', label: 'UserName/用户名' },
  { value: 'email', label: 'Email/邮箱' },
  { value: 'phone', label: 'Phone/电话' },
]
const basicSegment = ref('week')
const controlledSegment = ref('week')
const bilingualSegment = ref('name')
const loadingSegment = ref('day')
const segmentLoading = ref(false)

function selectLoadingSegment(value: unknown) {
  loadingSegment.value = String(value)
  segmentLoading.value = true
  window.setTimeout(() => (segmentLoading.value = false), 1200)
}

/* tag */
const tags = ref([
  { id: 1, label: 'Vue' },
  { id: 2, label: 'TypeScript' },
  { id: 3, label: 'Vuetify' },
])
let nextTagId = 4

function removeTag(id: number) {
  tags.value = tags.value.filter((tag) => tag.id !== id)
}

function addTag() {
  const id = nextTagId
  nextTagId += 1
  tags.value.push({ id, label: `Tag ${id}` })
}

const initialClosableTags = [
  { id: 1, label: 'Primary', color: 'primary' },
  { id: 2, label: 'Success', color: 'success' },
  { id: 3, label: 'Warning', color: 'warning' },
  { id: 4, label: 'Error', color: 'error' },
]
const closableTags = ref([...initialClosableTags])

function removeClosableTag(id: number) {
  closableTags.value = closableTags.value.filter((tag) => tag.id !== id)
}

function restoreClosableTags() {
  closableTags.value = [...initialClosableTags]
}

const techTags = [
  'JavaScript',
  'CSS',
  'HTML',
  'Node.js',
  'Express',
  'MongoDB',
  'Python',
  'Django',
  'Flask',
  'Java',
  'Spring',
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'GraphQL',
  'REST',
  'API',
  'Database',
  'Backend',
  'Frontend',
  'Fullstack',
]
const tagPalette = ['primary', 'secondary', 'success', 'warning', 'error', 'info']
const tagColor = (index: number) =>
  index % 7 === 6 ? undefined : tagPalette[index % tagPalette.length]
const tagSize = (index: number) =>
  (['small', 'default', 'large'] as const)[index % 3]

/* timeline */
const timelineSteps = [
  {
    id: '1',
    time: 'STEP 01',
    title: 'Security check',
    text: 'Full system scan to keep the environment safe.',
    icon: 'mdi-shield-check-outline',
  },
  {
    id: '2',
    time: 'STEP 02',
    title: 'Performance boost',
    text: 'Cache tuning and lazy loading cut response time in half.',
    icon: 'mdi-lightning-bolt-outline',
  },
  {
    id: '3',
    time: 'STEP 03',
    title: 'Global deployment',
    text: 'Multi-node sync across twelve time zones.',
    icon: 'mdi-earth',
  },
  {
    id: '4',
    time: 'STEP 04',
    title: 'Customer success',
    text: 'Round-the-clock support with a 99% satisfaction score.',
    icon: 'mdi-heart-outline',
  },
]
const activeStep = ref('2')

/* tour */
const tourOpen = ref(false)
const tourStep = ref(0)
const tourSteps = [
  {
    title: 'Step 1 · Main action',
    text: 'This is the primary action button. Click it to submit the form.',
  },
  {
    title: 'Step 2 · Search box',
    text: 'Search the catalogue from here. Press Escape to leave the tour.',
  },
]
const tourAction = ref('')

function startTour() {
  tourStep.value = 0
  tourOpen.value = true
}

function nextTourStep() {
  if (tourStep.value < tourSteps.length - 1) {
    tourStep.value += 1
  } else {
    tourOpen.value = false
  }
}

function previousTourStep() {
  if (tourStep.value > 0) tourStep.value -= 1
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.display')" />

    <v-tabs v-model="tab" color="primary">
      <v-tab value="avatar">Avatar</v-tab>
      <v-tab value="badge">Badge</v-tab>
      <v-tab value="calendar">Calendar</v-tab>
      <v-tab value="card">Card</v-tab>
      <v-tab value="carousel">Carousel</v-tab>
      <v-tab value="accordion">Accordion</v-tab>
      <v-tab value="descriptions">Descriptions</v-tab>
      <v-tab value="empty">Empty</v-tab>
      <v-tab value="image">Image</v-tab>
      <v-tab value="popover">Popover</v-tab>
      <v-tab value="qrcode">QRCode</v-tab>
      <v-tab value="segmented">Segmented</v-tab>
      <v-tab value="tag">Tag</v-tab>
      <v-tab value="timeline">Timeline</v-tab>
      <v-tab value="tooltip">Tooltip</v-tab>
      <v-tab value="tour">Tour</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="display-window">
      <!-- Avatar -->
      <v-window-item value="avatar">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Basic usage" subtitle="Image with initials fallback">
            <div class="row">
              <v-avatar size="48"><v-img :src="avatarImages[0]" alt="CN" /></v-avatar>
              <v-avatar size="48"><v-img :src="avatarImages[1]" alt="RU" /></v-avatar>
              <v-avatar size="48" color="primary"><span class="text-body-2">UF</span></v-avatar>
              <v-avatar size="48" color="secondary"><v-icon>mdi-account-outline</v-icon></v-avatar>
            </div>
            <p class="demo-note">
              When the image cannot be loaded the fallback initials stay visible.
            </p>
          </DemoSection>

          <DemoSection title="Sizes" subtitle="32 / 48 / 64 / 96 px">
            <div class="row align-end">
              <v-avatar v-for="size in [32, 48, 64, 96]" :key="size" :size="size">
                <v-img :src="avatarImages[2]" alt="JD" />
              </v-avatar>
            </div>
          </DemoSection>

          <DemoSection title="With badge" subtitle="Presence indicators">
            <div class="row">
              <v-badge dot color="success" location="bottom right" offset-x="2" offset-y="2">
                <v-avatar size="48"><v-img :src="avatarImages[0]" alt="Online" /></v-avatar>
              </v-badge>
              <v-badge dot color="error" location="bottom right" offset-x="2" offset-y="2">
                <v-avatar size="48"><v-img :src="avatarImages[1]" alt="Offline" /></v-avatar>
              </v-badge>
              <v-badge dot color="warning" location="bottom right" offset-x="2" offset-y="2">
                <v-avatar size="48" color="primary"><span class="text-body-2">AW</span></v-avatar>
              </v-badge>
            </div>
            <p class="demo-note">Green is online, amber is away, red is offline.</p>
          </DemoSection>

          <DemoSection title="Fallback types" subtitle="Initials, full name, icon">
            <div class="row">
              <v-avatar size="48" color="primary"><span class="text-body-2">JD</span></v-avatar>
              <v-avatar size="48" color="secondary"><span class="text-caption">John Doe</span></v-avatar>
              <v-avatar size="48" color="surface-variant">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Badge -->
      <v-window-item value="badge">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Basic variants" subtitle="Inline badges for labels">
            <div class="badge-row">
              <v-badge inline content="Default" color="primary" />
              <v-badge inline content="Secondary" color="secondary" />
              <v-badge inline content="Destructive" color="error" />
              <v-badge inline content="Outline" color="surface" text-color="on-surface" bordered />
            </div>
          </DemoSection>

          <DemoSection title="With icons" subtitle="Status at a glance">
            <div class="badge-row">
              <v-badge inline color="success">
                <template #badge><v-icon icon="mdi-check" size="12" class="mr-1" />Success</template>
              </v-badge>
              <v-badge inline color="error">
                <template #badge><v-icon icon="mdi-close" size="12" class="mr-1" />Error</template>
              </v-badge>
              <v-badge inline color="warning">
                <template #badge>
                  <v-icon icon="mdi-alert-outline" size="12" class="mr-1" />Warning
                </template>
              </v-badge>
              <v-badge inline color="info">
                <template #badge>
                  <v-icon icon="mdi-information-outline" size="12" class="mr-1" />Info
                </template>
              </v-badge>
            </div>
          </DemoSection>

          <DemoSection title="In context" subtitle="Notification list">
            <v-list density="compact" class="badge-list">
              <v-list-item title="New message">
                <template #append><v-badge inline content="1" color="error" /></template>
              </v-list-item>
              <v-list-item title="System update">
                <template #append><v-badge inline content="Available" color="primary" /></template>
              </v-list-item>
              <v-list-item title="Task completed">
                <template #append><v-badge inline content="Done" color="secondary" /></template>
              </v-list-item>
            </v-list>
          </DemoSection>

          <DemoSection title="On icons & avatars" subtitle="Counter badges">
            <div class="row badge-gap">
              <v-badge :content="3" color="error">
                <v-icon size="28">mdi-bell-outline</v-icon>
              </v-badge>
              <v-badge :content="12" color="primary" :max="9">
                <v-icon size="28">mdi-email-outline</v-icon>
              </v-badge>
              <v-badge dot color="success" location="bottom right">
                <v-avatar size="44"><v-img :src="avatarImages[0]" alt="User" /></v-avatar>
              </v-badge>
              <v-badge dot color="warning" location="bottom right">
                <v-avatar size="44"><v-img :src="avatarImages[2]" alt="User" /></v-avatar>
              </v-badge>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Calendar -->
      <v-window-item value="calendar">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Single date" subtitle="Click a day to select it">
            <v-date-picker v-model="singleDate" color="primary" :header="fmtDate(singleDate)" />
            <v-card variant="tonal" color="primary" class="date-summary">
              <v-card-text>
                <div class="date-large">{{ fmtDate(singleDate) }}</div>
                <div class="demo-note">Selected date is bound with v-model.</div>
              </v-card-text>
            </v-card>
          </DemoSection>

          <DemoSection title="Date range" subtitle="Pick a start and an end date">
            <div class="range-pickers">
              <div>
                <div class="field-label">From</div>
                <v-date-picker v-model="fromDate" color="primary" hide-header />
              </div>
              <div>
                <div class="field-label">To</div>
                <v-date-picker v-model="toDate" color="primary" hide-header />
              </div>
            </div>
            <v-card variant="tonal" color="success">
              <v-card-text>
                <div class="date-large">{{ rangeDays }} day(s)</div>
                <div class="demo-note">{{ fmtDate(fromDate) }} → {{ fmtDate(toDate) }}</div>
              </v-card-text>
            </v-card>
          </DemoSection>

          <DemoSection title="Disabled past dates" subtitle="Only today and future dates">
            <v-date-picker
              v-model="futureDate"
              color="primary"
              :min="todayIso"
              :allowed-dates="allowedFromToday"
            />
            <p class="demo-note">The min prop and allowed-dates keep earlier days unavailable.</p>
          </DemoSection>

          <DemoSection title="Multiple dates" subtitle="Select several days">
            <v-date-picker v-model="multipleDates" color="primary" multiple />
            <div class="row">
              <v-chip
                v-for="date in multipleDates"
                :key="date"
                size="small"
                color="primary"
                variant="tonal"
              >
                {{ date }}
              </v-chip>
              <span v-if="!multipleDates.length" class="demo-note">No dates selected</span>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Card -->
      <v-window-item value="card">
        <DemoSection title="Basic card" subtitle="Media, title, support text and actions">
          <div class="demo-grid demo-grid--2">
            <v-card class="media-card">
              <v-img :src="images[0]" height="160" cover />
              <v-card-title>ORANGE console</v-card-title>
              <v-card-subtitle>Vue 3 · Vuetify 3 · RBAC</v-card-subtitle>
              <v-card-text class="text-body-2">
                A card combines media, a title, supporting copy and actions.
              </v-card-text>
              <v-card-actions>
                <v-btn variant="text" color="primary">Open</v-btn>
                <v-spacer />
                <v-btn icon="mdi-share-variant-outline" variant="text" aria-label="Share" />
              </v-card-actions>
            </v-card>

            <v-card title="Basic card" subtitle="This is a basic card example.">
              <v-card-text class="text-body-2">
                Cards can hold text, images and interactive elements. This variant uses the compact
                title and subtitle props.
              </v-card-text>
              <v-card-actions>
                <v-btn variant="tonal">Close</v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </DemoSection>

        <DemoSection title="Profile & form" subtitle="Two content-heavy card layouts">
          <div class="demo-grid demo-grid--2">
            <v-card>
              <v-card-item title="Profile card" subtitle="Manage account settings" />
              <v-card-text>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-account-outline" title="John Doe" />
                  <v-list-item prepend-icon="mdi-email-outline" title="john@example.com" />
                  <v-list-item prepend-icon="mdi-home-outline" title="San Francisco, CA" />
                </v-list>
              </v-card-text>
              <v-card-actions>
                <v-btn variant="outlined">Cancel</v-btn>
                <v-spacer />
                <v-btn color="primary">Save changes</v-btn>
              </v-card-actions>
            </v-card>

            <v-card>
              <v-card-item title="Create project" subtitle="Add a project to manage." />
              <v-card-text class="form-stack">
                <v-text-field v-model="projectName" label="Project name" density="compact" />
                <v-text-field
                  v-model="projectDescription"
                  label="Description"
                  density="compact"
                />
                <v-checkbox v-model="acceptTerms" label="Accept terms and conditions" hide-details />
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" block>Create project</v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </DemoSection>

        <DemoSection title="Navigation cards" subtitle="Shortcut tiles">
          <v-row dense>
            <v-col v-for="tile in [
              { icon: 'mdi-bell-outline', title: 'Notifications', text: 'Manage notification preferences', color: 'info' },
              { icon: 'mdi-cog-outline', title: 'Settings', text: 'Customise the application', color: 'success' },
              { icon: 'mdi-credit-card-outline', title: 'Billing', text: 'Manage payment methods', color: 'secondary' },
              { icon: 'mdi-gift-outline', title: 'Offers', text: 'Special deals and promotions', color: 'warning' },
            ]" :key="tile.title" cols="12" sm="6" lg="3">
              <v-card class="nav-card" variant="outlined">
                <v-card-text class="nav-card-body">
                  <v-avatar :color="tile.color" variant="tonal" size="48">
                    <v-icon>{{ tile.icon }}</v-icon>
                  </v-avatar>
                  <div class="nav-card-title">{{ tile.title }}</div>
                  <div class="demo-note nav-card-text">{{ tile.text }}</div>
                </v-card-text>
                <v-card-actions>
                  <v-btn variant="outlined" block size="small">Configure</v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </DemoSection>

        <DemoSection title="Interactive card" subtitle="Upcoming events">
          <v-card max-width="380">
            <v-card-item title="Event reminder" subtitle="Upcoming events this week" />
            <v-card-text>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-calendar-outline" title="Team meeting" subtitle="Today, 10:00 AM" />
                <v-list-item prepend-icon="mdi-message-outline" title="Client call" subtitle="Tomorrow, 2:30 PM" />
                <v-list-item prepend-icon="mdi-plus-circle-outline" title="New project" subtitle="Friday, 11:00 AM" />
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="outlined" block>View all events</v-btn>
            </v-card-actions>
          </v-card>
        </DemoSection>
      </v-window-item>

      <!-- Carousel -->
      <v-window-item value="carousel">
        <DemoSection title="Basic carousel" subtitle="Cycle through numbered slides">
          <v-carousel
            v-model="basicSlide"
            height="240"
            hide-delimiters
            show-arrows="hover"
            cycle
            :interval="4000"
          >
            <v-carousel-item v-for="index in numberedSlides" :key="index">
              <div class="carousel-slide">
                <v-card variant="flat" class="carousel-number">
                  <span class="display-number">{{ index }}</span>
                </v-card>
              </div>
            </v-carousel-item>
          </v-carousel>
          <div class="row between">
            <span class="demo-note">Slide {{ basicSlide + 1 }} / {{ numberedSlides.length }}</span>
            <v-btn-group variant="outlined" density="compact">
              <v-btn
                icon="mdi-chevron-left"
                aria-label="Previous slide"
                @click="basicSlide = (basicSlide + numberedSlides.length - 1) % numberedSlides.length"
              />
              <v-btn
                icon="mdi-chevron-right"
                aria-label="Next slide"
                @click="basicSlide = (basicSlide + 1) % numberedSlides.length"
              />
            </v-btn-group>
          </div>
        </DemoSection>

        <DemoSection title="Carousel with captions" subtitle="Images, captions and progress">
          <v-carousel
            v-model="captionSlide"
            height="260"
            progress="primary"
            cycle
            :interval="5000"
            show-arrows="hover"
          >
            <v-carousel-item v-for="slide in captionSlides" :key="slide.title">
              <div class="carousel-slide" :style="{ background: slide.background }">
                <div class="carousel-caption">
                  <div class="carousel-title">{{ slide.title }}</div>
                  <div class="carousel-text">{{ slide.text }}</div>
                </div>
              </div>
            </v-carousel-item>
          </v-carousel>
          <div class="row">
            <v-chip
              v-for="(slide, index) in captionSlides"
              :key="slide.title"
              :color="index === captionSlide ? 'primary' : undefined"
              :variant="index === captionSlide ? 'flat' : 'outlined'"
              size="small"
              @click="captionSlide = index"
            >
              {{ index + 1 }}
            </v-chip>
            <span class="demo-note">{{ captionSlides[captionSlide]?.title }}</span>
          </div>
        </DemoSection>

        <DemoSection title="Image carousel" subtitle="Gradient artwork with hover navigation">
          <v-carousel v-model="basicSlide" height="280" hide-delimiters show-arrows="hover">
            <v-carousel-item v-for="(image, index) in images" :key="image">
              <v-img :src="image" height="280" cover :alt="`Slide ${index + 1}`">
                <div class="image-overlay">
                  <div class="carousel-title">Nature scene {{ index + 1 }}</div>
                </div>
              </v-img>
            </v-carousel-item>
          </v-carousel>
        </DemoSection>
      </v-window-item>

      <!-- Accordion -->
      <v-window-item value="accordion">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Basic accordion" subtitle="One panel open at a time">
            <v-expansion-panels v-model="singlePanel" variant="accordion">
              <v-expansion-panel title="Is it accessible?">
                <v-expansion-panel-text>
                  Yes. It follows the WAI-ARIA design pattern and supports keyboard navigation.
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="Is it styled?">
                <v-expansion-panel-text>
                  Yes. The default styles match the rest of the component set.
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="Is it animated?">
                <v-expansion-panel-text>
                  Yes. Panels animate by default and the transition can be customised.
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </DemoSection>

          <DemoSection title="Multiple expandable" subtitle="Open several panels at once">
            <v-expansion-panels v-model="multiPanels" multiple variant="popout">
              <v-expansion-panel title="What is a good API?">
                <v-expansion-panel-text>
                  A good API is like a good joke: if you have to explain it, it is not that good.
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="Why do Java developers wear glasses?">
                <v-expansion-panel-text>
                  Because they do not C#. Also, screen light is bright, so take breaks.
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="How do you comfort a JavaScript bug?">
                <v-expansion-panel-text>
                  You console it. Then grab a coffee and come back with fresh eyes.
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="Why did the developer go broke?">
                <v-expansion-panel-text>
                  Because he used up all his cache, and forgot to save his work.
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </DemoSection>
        </div>

        <div class="demo-grid demo-grid--2">
          <DemoSection title="Custom styling" subtitle="Inset panel with custom trigger">
            <v-expansion-panels variant="inset" class="custom-panels">
              <v-expansion-panel>
                <v-expansion-panel-title class="custom-trigger">
                  Custom trigger style
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  This item applies custom styling to both the trigger and the content.
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-title class="custom-trigger">
                  Another custom item
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  Each panel can be customised individually.
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </DemoSection>

          <DemoSection title="Long content" subtitle="Panel growth and scrolling">
            <v-expansion-panels>
              <v-expansion-panel title="Click to expand long content">
                <v-expansion-panel-text>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  <p class="mt-2">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                    fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
                  </p>
                  <p class="mt-2">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                    doloremque laudantium, totam rem aperiam.
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Descriptions -->
      <v-window-item value="descriptions">
        <DemoSection title="Horizontal layout" subtitle="Label and value pairs in columns">
          <v-table density="compact" class="desc-table">
            <tbody>
              <tr>
                <th class="desc-label">Username</th>
                <td>zhangsan</td>
                <th class="desc-label">Telephone</th>
                <td>18100000000</td>
              </tr>
              <tr>
                <th class="desc-label">Live</th>
                <td>Hangzhou, Zhejiang</td>
                <th class="desc-label">Address</th>
                <td>West Lake District, Hangzhou</td>
              </tr>
              <tr>
                <th class="desc-label">Remark</th>
                <td>None</td>
                <th class="desc-label">Email</th>
                <td>zhangsan@example.com</td>
              </tr>
            </tbody>
          </v-table>
        </DemoSection>

        <DemoSection title="Vertical layout" subtitle="Bordered header row">
          <v-table density="compact" class="desc-table desc-bordered">
            <thead>
              <tr>
                <th class="desc-label">Username</th>
                <th class="desc-label">Telephone</th>
                <th class="desc-label">Live</th>
                <th class="desc-label">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>zhangsan</td>
                <td>18100000000</td>
                <td>Hangzhou, Zhejiang</td>
                <td>zhangsan@example.com</td>
              </tr>
            </tbody>
          </v-table>
        </DemoSection>

        <DemoSection title="Project details" subtitle="Merged cells and status colour">
          <v-table density="compact" class="desc-table desc-bordered">
            <tbody>
              <tr>
                <th class="desc-label">Project name</th>
                <td colspan="2">My Awesome Project</td>
                <th class="desc-label">Status</th>
                <td class="text-success font-weight-bold">Completed</td>
              </tr>
              <tr>
                <th class="desc-label">Start date</th>
                <td>2023-01-01</td>
                <th class="desc-label">End date</th>
                <td colspan="2">2023-12-31</td>
              </tr>
              <tr>
                <th class="desc-label">Description</th>
                <td colspan="4">
                  A cross-team project that delivers a high-quality solution for customer needs.
                </td>
              </tr>
              <tr>
                <th class="desc-label">Team lead</th>
                <td>John Doe</td>
                <th class="desc-label">Budget</th>
                <td colspan="2">$50,000</td>
              </tr>
            </tbody>
          </v-table>
        </DemoSection>

        <DemoSection title="System info" subtitle="Mixed spans with horizontal layout">
          <v-table density="compact" class="desc-table">
            <tbody>
              <tr>
                <th class="desc-label">OS</th>
                <td>Ubuntu 20.04 LTS</td>
                <th class="desc-label">CPU</th>
                <td colspan="2">Intel Core i7-10700K</td>
              </tr>
              <tr>
                <th class="desc-label">Memory</th>
                <td>32GB DDR4</td>
                <th class="desc-label">GPU</th>
                <td colspan="2">NVIDIA RTX 3080</td>
              </tr>
              <tr>
                <th class="desc-label">Disk</th>
                <td colspan="4">1TB NVMe SSD</td>
              </tr>
            </tbody>
          </v-table>
        </DemoSection>
      </v-window-item>

      <!-- Empty -->
      <v-window-item value="empty">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Basic empty" subtitle="No documents yet">
            <v-empty-state
              icon="mdi-folder-open-outline"
              title="No documents"
              text="Create your first document to get started."
            />
          </DemoSection>

          <DemoSection title="With actions" subtitle="Search returned nothing">
            <v-empty-state
              icon="mdi-magnify"
              title="No results found"
              text="Try adjusting your search to find what you are looking for."
            >
              <template #actions>
                <v-btn color="primary" variant="flat">Clear filters</v-btn>
              </template>
            </v-empty-state>
          </DemoSection>

          <DemoSection title="User registration" subtitle="Empty user list">
            <v-empty-state
              icon="mdi-account-plus-outline"
              title="No users"
              text="Get started by creating a new user or importing existing ones."
            >
              <template #actions>
                <v-btn variant="outlined">Import</v-btn>
                <v-btn color="primary">Create user</v-btn>
              </template>
            </v-empty-state>
          </DemoSection>

          <DemoSection title="Custom media" subtitle="Page not found">
            <v-empty-state title="Page not found" text="The page you are looking for does not exist or has moved.">
              <template #media>
                <div class="empty-badge">404</div>
              </template>
              <template #actions>
                <v-btn color="primary">Go home</v-btn>
              </template>
            </v-empty-state>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Image -->
      <v-window-item value="image">
        <DemoSection title="Avatar images" subtitle="Image, fallback and initials">
          <v-row dense>
            <v-col v-for="item in [
              { title: 'With image', text: 'Avatar with image', src: avatarImages[0], fallback: 'CN' },
              { title: 'Fallback', text: 'Avatar with fallback', src: '', fallback: 'NC' },
              { title: 'Initials', text: 'Avatar with initials', src: '', fallback: 'JD' },
            ]" :key="item.title" cols="12" sm="4">
              <v-card variant="outlined" class="center-card">
                <v-card-text class="center-stack">
                  <v-avatar size="88" color="primary">
                    <v-img v-if="item.src" :src="item.src" :alt="item.title" />
                    <span v-else class="text-h6">{{ item.fallback }}</span>
                  </v-avatar>
                  <div class="field-label">{{ item.title }}</div>
                  <div class="demo-note">{{ item.text }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </DemoSection>

        <DemoSection title="Different sizes" subtitle="40 / 64 / 96 / 128 px">
          <div class="row surface-strip">
            <v-avatar v-for="size in [40, 64, 96, 128]" :key="size" :size="size">
              <v-img :src="images[1]" alt="Vue" />
            </v-avatar>
          </div>
        </DemoSection>

        <DemoSection title="Avatar groups" subtitle="Overlapping stack with overflow count">
          <div class="row surface-strip">
            <div class="avatar-stack">
              <v-avatar size="48" class="stacked"><v-img :src="avatarImages[0]" alt="User 1" /></v-avatar>
              <v-avatar size="48" class="stacked"><v-img :src="avatarImages[1]" alt="User 2" /></v-avatar>
              <v-avatar size="48" class="stacked"><v-img :src="avatarImages[2]" alt="User 3" /></v-avatar>
              <v-avatar size="48" class="stacked" color="surface-variant">
                <span class="text-caption">+3</span>
              </v-avatar>
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Status avatars" subtitle="Online, away, busy and offline">
          <div class="row surface-strip">
            <div v-for="person in [
              { label: 'Online', color: 'success' },
              { label: 'Away', color: 'warning' },
              { label: 'Busy', color: 'error' },
              { label: 'Offline', color: 'grey' },
            ]" :key="person.label" class="person">
              <v-badge dot :color="person.color" location="bottom right">
                <v-avatar size="56"><v-img :src="images[2]" alt="Person" /></v-avatar>
              </v-badge>
              <span class="demo-note">{{ person.label }}</span>
            </div>
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Popover -->
      <v-window-item value="popover">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Basic popover" subtitle="Dimensions form inside a menu">
            <v-menu :close-on-content-click="false" location="bottom start">
              <template #activator="{ props: activatorProps }">
                <v-btn v-bind="activatorProps" variant="outlined">Open popover</v-btn>
              </template>
              <v-card width="320" class="popover-card">
                <v-card-item title="Dimensions" subtitle="Set the dimensions for the layer." />
                <v-card-text class="form-stack">
                  <v-text-field label="Width" model-value="100%" density="compact" hide-details />
                  <v-text-field label="Max. width" model-value="300px" density="compact" hide-details />
                  <v-text-field label="Height" model-value="25px" density="compact" hide-details />
                  <v-text-field label="Max. height" model-value="none" density="compact" hide-details />
                </v-card-text>
              </v-card>
            </v-menu>
            <p class="demo-note">Menus keep focus while the content stays interactive.</p>
          </DemoSection>

          <DemoSection title="Direction popovers" subtitle="Top, right, bottom and left">
            <div class="row center-row">
              <div v-for="direction in [
                { location: 'top', icon: 'mdi-arrow-up', label: 'Top' },
                { location: 'right', icon: 'mdi-arrow-right', label: 'Right' },
                { location: 'bottom', icon: 'mdi-arrow-down', label: 'Bottom' },
                { location: 'left', icon: 'mdi-arrow-left', label: 'Left' },
              ]" :key="direction.location" class="direction-item">
                <v-menu :location="direction.location">
                  <template #activator="{ props: activatorProps }">
                    <v-btn
                      v-bind="activatorProps"
                      :icon="direction.icon"
                      variant="outlined"
                      size="small"
                      :aria-label="direction.label"
                    />
                  </template>
                  <v-card width="180">
                    <v-card-text>Popover on {{ direction.label.toLowerCase() }}</v-card-text>
                  </v-card>
                </v-menu>
                <span class="demo-note">{{ direction.label }}</span>
              </div>
            </div>
          </DemoSection>

          <DemoSection title="Settings popover" subtitle="Preferences with switches">
            <v-menu :close-on-content-click="false">
              <template #activator="{ props: activatorProps }">
                <v-btn v-bind="activatorProps" variant="outlined" prepend-icon="mdi-cog-outline">
                  Settings
                </v-btn>
              </template>
              <v-card width="300">
                <v-card-item title="App settings" subtitle="Customise application preferences" />
                <v-card-text class="switch-stack">
                  <v-switch v-model="preferences.email" label="Email notifications" density="compact" hide-details color="primary" />
                  <v-switch v-model="preferences.push" label="Push notifications" density="compact" hide-details color="primary" />
                  <v-switch v-model="preferences.autoSave" label="Auto-save" density="compact" hide-details color="primary" />
                  <v-switch v-model="preferences.shortcuts" label="Keyboard shortcuts" density="compact" hide-details color="primary" />
                  <v-switch v-model="preferences.analytics" label="Analytics" density="compact" hide-details color="primary" />
                </v-card-text>
              </v-card>
            </v-menu>
          </DemoSection>

          <DemoSection title="Action popover" subtitle="Schedule a post">
            <v-menu :close-on-content-click="false">
              <template #activator="{ props: activatorProps }">
                <v-btn
                  v-bind="activatorProps"
                  variant="outlined"
                  prepend-icon="mdi-calendar-clock-outline"
                >
                  Schedule post
                </v-btn>
              </template>
              <v-card width="320">
                <v-card-item title="Schedule post" subtitle="Choose when to publish" />
                <v-card-text class="form-stack">
                  <v-text-field type="date" label="Date" density="compact" />
                  <v-text-field type="time" label="Time" density="compact" />
                  <div class="row end">
                    <v-btn variant="text" size="small">Cancel</v-btn>
                    <v-btn color="primary" size="small">Schedule</v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-menu>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- QRCode -->
      <v-window-item value="qrcode">
        <DemoSection title="Color variants" subtitle="Foreground and background combinations">
          <v-row dense>
            <v-col v-for="preset in qrColorPresets" :key="preset.title" cols="12" sm="6" md="4" lg="2">
              <v-card variant="outlined" class="center-card qr-card">
                <v-card-item class="text-center">
                  <v-card-title class="text-body-1">{{ preset.title }}</v-card-title>
                  <v-card-subtitle>{{ preset.subtitle }}</v-card-subtitle>
                </v-card-item>
                <v-card-text class="qr-center">
                  <svg
                    class="qr-svg"
                    viewBox="0 0 21 21"
                    width="128"
                    height="128"
                    shape-rendering="crispEdges"
                    :style="{ background: preset.bg }"
                    role="img"
                    :aria-label="`${preset.title} QR code`"
                  >
                    <rect
                      v-for="cell in presetQrCells"
                      :key="`${preset.title}-${cell.x}-${cell.y}`"
                      :x="cell.x"
                      :y="cell.y"
                      width="1"
                      height="1"
                      :fill="preset.fg"
                    />
                    <g v-for="origin in finderOrigins" :key="`${preset.title}-${origin.x}-${origin.y}`">
                      <rect :x="origin.x" :y="origin.y" width="7" height="7" :fill="preset.fg" />
                      <rect :x="origin.x + 1" :y="origin.y + 1" width="5" height="5" :fill="preset.bg" />
                      <rect :x="origin.x + 2" :y="origin.y + 2" width="3" height="3" :fill="preset.fg" />
                    </g>
                  </svg>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </DemoSection>

        <DemoSection title="Different sizes" subtitle="64 to 300 pixels">
          <div class="row center-row qr-sizes">
            <div v-for="preset in qrSizePresets" :key="preset.label" class="qr-size-item">
              <svg
                class="qr-svg"
                viewBox="0 0 21 21"
                :width="preset.size"
                :height="preset.size"
                shape-rendering="crispEdges"
                :style="{ background: qrBg }"
                role="img"
                :aria-label="`${preset.label} QR code`"
              >
                <rect
                  v-for="cell in presetQrCells"
                  :key="`${preset.label}-${cell.x}-${cell.y}`"
                  :x="cell.x"
                  :y="cell.y"
                  width="1"
                  height="1"
                  :fill="qrFg"
                />
                <g v-for="origin in finderOrigins" :key="`${preset.label}-${origin.x}-${origin.y}`">
                  <rect :x="origin.x" :y="origin.y" width="7" height="7" :fill="qrFg" />
                  <rect :x="origin.x + 1" :y="origin.y + 1" width="5" height="5" :fill="qrBg" />
                  <rect :x="origin.x + 2" :y="origin.y + 2" width="3" height="3" :fill="qrFg" />
                </g>
              </svg>
              <span class="demo-note">{{ preset.label }} · {{ preset.size }}px</span>
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Dynamic QR code" subtitle="Adjust value, size and colours">
          <div class="qr-builder">
            <v-card variant="outlined" class="qr-controls">
              <v-card-text class="form-stack">
                <v-text-field v-model="qrValue" label="URL" density="compact" />
                <div>
                  <div class="field-label">Size: {{ qrSize }}px</div>
                  <v-slider v-model="qrSize" :min="64" :max="300" :step="4" hide-details color="primary" />
                </div>
                <div class="qr-colors">
                  <label class="color-field">
                    <span class="demo-note">Foreground</span>
                    <input v-model="qrFg" type="color" />
                  </label>
                  <label class="color-field">
                    <span class="demo-note">Background</span>
                    <input v-model="qrBg" type="color" />
                  </label>
                </div>
                <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="copyUrl">
                  {{ copyLabel }}
                </v-btn>
              </v-card-text>
            </v-card>
            <div class="qr-preview">
              <svg
                class="qr-svg"
                viewBox="0 0 21 21"
                :width="qrSize"
                :height="qrSize"
                shape-rendering="crispEdges"
                :style="{ background: qrBg }"
                role="img"
                aria-label="Dynamic QR code"
              >
                <rect
                  v-for="cell in qrCells"
                  :key="`dynamic-${cell.x}-${cell.y}`"
                  :x="cell.x"
                  :y="cell.y"
                  width="1"
                  height="1"
                  :fill="qrFg"
                />
                <g v-for="origin in finderOrigins" :key="`dynamic-${origin.x}-${origin.y}`">
                  <rect :x="origin.x" :y="origin.y" width="7" height="7" :fill="qrFg" />
                  <rect :x="origin.x + 1" :y="origin.y + 1" width="5" height="5" :fill="qrBg" />
                  <rect :x="origin.x + 2" :y="origin.y + 2" width="3" height="3" :fill="qrFg" />
                </g>
              </svg>
              <span class="demo-note">{{ qrValue || 'Enter a value to encode' }}</span>
            </div>
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Segmented -->
      <v-window-item value="segmented">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Basic segmented" subtitle="Day / week / month">
            <v-btn-toggle v-model="basicSegment" mandatory divided color="primary" variant="outlined">
              <v-btn v-for="option in segmentOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </v-btn>
            </v-btn-toggle>
            <p class="demo-note">Selected: {{ basicSegment }}</p>
          </DemoSection>

          <DemoSection title="Controlled segmented" subtitle="Model bound to local state">
            <div class="row">
              <v-btn-toggle
                v-model="controlledSegment"
                mandatory
                divided
                color="primary"
                variant="outlined"
              >
                <v-btn v-for="option in segmentOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </v-btn>
              </v-btn-toggle>
              <span class="demo-note">Current: {{ controlledSegment }}</span>
            </div>
          </DemoSection>

          <DemoSection title="Loading state" subtitle="Selected item shows a spinner">
            <div class="row">
              <v-btn-toggle
                v-model="loadingSegment"
                mandatory
                divided
                color="primary"
                variant="outlined"
                @update:model-value="selectLoadingSegment"
              >
                <v-btn v-for="option in segmentOptions" :key="option.value" :value="option.value">
                  <template
                    v-if="segmentLoading && loadingSegment === option.value"
                    #prepend
                  >
                    <v-progress-circular indeterminate size="14" width="2" />
                  </template>
                  {{ option.label }}
                </v-btn>
              </v-btn-toggle>
              <v-btn variant="outlined" size="small" @click="selectLoadingSegment('month')">
                Set month
              </v-btn>
            </div>
            <p class="demo-note">The spinner clears after 1.2 seconds.</p>
          </DemoSection>

          <DemoSection title="States" subtitle="Bilingual, disabled and error">
            <div class="form-stack">
              <div>
                <div class="field-label">Bilingual labels</div>
                <v-btn-toggle v-model="bilingualSegment" mandatory divided color="primary" variant="outlined">
                  <v-btn v-for="option in bilingualOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </v-btn>
                </v-btn-toggle>
              </div>
              <div>
                <div class="field-label">Disabled</div>
                <v-btn-toggle :model-value="'day'" disabled mandatory divided variant="outlined">
                  <v-btn v-for="option in segmentOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </v-btn>
                </v-btn-toggle>
              </div>
              <div>
                <div class="field-label">Error style</div>
                <v-btn-toggle
                  :model-value="''"
                  mandatory
                  divided
                  variant="outlined"
                  class="segment-error"
                >
                  <v-btn v-for="option in segmentOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </v-btn>
                </v-btn-toggle>
                <div class="error-text">Selection required / 需要选择</div>
              </div>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Tag -->
      <v-window-item value="tag">
        <DemoSection title="Basic tags & sizes" subtitle="Semantic variants and three sizes">
          <div class="row">
            <v-chip>Default</v-chip>
            <v-chip color="primary">Primary</v-chip>
            <v-chip color="secondary">Secondary</v-chip>
            <v-chip color="success">Success</v-chip>
            <v-chip color="warning">Warning</v-chip>
            <v-chip color="error">Error</v-chip>
            <v-chip color="info">Info</v-chip>
          </div>
          <v-divider />
          <div class="row">
            <v-chip size="small">Small tag</v-chip>
            <v-chip>Medium tag</v-chip>
            <v-chip size="large">Large tag</v-chip>
          </div>
        </DemoSection>

        <DemoSection title="Closable & interactive" subtitle="Dismiss tags, then add or remove your own">
          <div class="row">
            <v-chip
              v-for="tag in closableTags"
              :key="tag.id"
              :color="tag.color"
              closable
              @click:close="removeClosableTag(tag.id)"
            >
              {{ tag.label }}
            </v-chip>
            <v-btn
              v-if="closableTags.length < initialClosableTags.length"
              variant="text"
              size="small"
              prepend-icon="mdi-restore"
              @click="restoreClosableTags"
            >
              Restore
            </v-btn>
          </div>
          <v-divider />
          <div class="row tag-editor">
            <v-chip
              v-for="tag in tags"
              :key="tag.id"
              color="secondary"
              variant="tonal"
              closable
              @click:close="removeTag(tag.id)"
            >
              {{ tag.label }}
            </v-chip>
            <v-btn variant="outlined" size="small" prepend-icon="mdi-plus" @click="addTag">
              Add tag
            </v-btn>
          </div>
          <p class="demo-note">{{ tags.length }} tag(s) in the interactive list.</p>
        </DemoSection>

        <DemoSection title="States & combinations" subtitle="Disabled chips and grouped labels">
          <div class="form-stack">
            <div class="row">
              <v-chip disabled>Disabled default</v-chip>
              <v-chip color="primary" disabled>Disabled primary</v-chip>
              <v-chip color="success" disabled closable>Disabled success</v-chip>
            </div>
            <v-divider />
            <div class="row">
              <v-chip color="primary" size="small">Technology</v-chip>
              <v-chip color="secondary" size="small">Framework</v-chip>
              <v-chip color="success" size="small">Library</v-chip>
              <v-chip color="info" size="small">Language</v-chip>
            </div>
            <div class="row">
              <v-chip color="warning" size="small">Beta</v-chip>
              <v-chip color="error" size="small">Deprecated</v-chip>
              <v-chip color="info" size="small">Experimental</v-chip>
              <v-chip color="success" size="small">Stable</v-chip>
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Tag cloud" subtitle="Mixed colours and sizes">
          <div class="row center-row">
            <v-chip
              v-for="(tech, index) in techTags"
              :key="tech"
              :color="tagColor(index)"
              :size="tagSize(index)"
              variant="tonal"
            >
              {{ tech }}
            </v-chip>
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Timeline -->
      <v-window-item value="timeline">
        <div class="demo-grid demo-grid--2">
          <DemoSection title="Vertical single side" subtitle="Click a step to activate it">
            <v-timeline side="end" density="compact">
              <v-timeline-item
                v-for="step in timelineSteps"
                :key="step.id"
                :dot-color="activeStep === step.id ? 'primary' : 'surface-variant'"
                :icon="step.icon"
                size="small"
                class="clickable"
                @click="activeStep = step.id"
              >
                <div class="timeline-time">{{ step.time }}</div>
                <div class="timeline-title">{{ step.title }}</div>
                <div class="timeline-text">{{ step.text }}</div>
              </v-timeline-item>
            </v-timeline>
          </DemoSection>

          <DemoSection title="Dense activity" subtitle="Audit log with trace context">
            <v-timeline side="end" density="compact" truncate-line="both">
              <v-timeline-item
                v-for="event in [
                  { time: '09:12', title: 'Deployment completed', text: 'release 2026.11.03 promoted to production.', color: 'success' },
                  { time: '10:04', title: 'Role updated', text: 'admin gained action#/system/role:edit.', color: 'primary' },
                  { time: '11:36', title: 'Login blocked', text: 'Five failures from 203.0.113.8 triggered a lock.', color: 'error' },
                  { time: '14:20', title: 'Permission tree synced', text: 'Catalog 0005 subtree written to the seed file.', color: 'info' },
                ]"
                :key="event.time"
                :dot-color="event.color"
                size="x-small"
              >
                <div class="timeline-time">{{ event.time }}</div>
                <div class="timeline-title">{{ event.title }}</div>
                <div class="timeline-text">{{ event.text }}</div>
              </v-timeline-item>
            </v-timeline>
          </DemoSection>
        </div>

        <DemoSection title="Horizontal alternate" subtitle="Roadmap across four milestones">
          <div class="timeline-scroll">
            <v-timeline direction="horizontal" align="center" truncate-line="both" density="compact">
              <v-timeline-item
                v-for="step in timelineSteps"
                :key="step.id"
                :dot-color="activeStep === step.id ? 'primary' : 'surface-variant'"
                :icon="step.icon"
                size="small"
                class="clickable"
                @click="activeStep = step.id"
              >
                <div class="horizontal-step">
                  <div class="timeline-time">{{ step.time }}</div>
                  <div class="timeline-title">{{ step.title }}</div>
                  <div class="timeline-text">{{ step.text }}</div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>
        </DemoSection>
      </v-window-item>

      <!-- Tooltip -->
      <v-window-item value="tooltip">
        <DemoSection title="Rich profile tooltip" subtitle="Hover the avatar for a member card">
          <div class="row center-row tooltip-stage">
            <v-tooltip location="top" :max-width="280" :open-delay="100">
              <template #activator="{ props: activatorProps }">
                <v-badge
                  v-bind="activatorProps"
                  dot
                  color="success"
                  location="bottom right"
                  class="cursor-pointer"
                >
                  <v-avatar size="52" color="secondary">
                    <v-icon>mdi-creation</v-icon>
                  </v-avatar>
                </v-badge>
              </template>
              <v-card variant="flat" class="tooltip-card">
                <v-card-text>
                  <div class="row between">
                    <strong>Premium plan</strong>
                    <v-chip size="x-small" color="primary" variant="tonal">PRO</v-chip>
                  </div>
                  <p class="demo-note mt-2">
                    Unlock every AI feature, unlimited high-resolution exports and priority renders.
                  </p>
                  <v-divider class="my-2" />
                  <div class="row between">
                    <span class="demo-note">Next billing: 2026.12.01</span>
                    <span class="link-text">Manage</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-tooltip>
            <span class="demo-note">Profile / status tooltip</span>
          </div>
        </DemoSection>

        <div class="demo-grid demo-grid--3">
          <DemoSection title="Danger action" subtitle="Semantic warning colour">
            <v-tooltip location="bottom" :max-width="240" content-class="tooltip-danger">
              <template #activator="{ props: activatorProps }">
                <v-btn
                  v-bind="activatorProps"
                  variant="outlined"
                  color="error"
                  prepend-icon="mdi-alert-circle-outline"
                >
                  Delete project
                </v-btn>
              </template>
              <span>This action cannot be undone.</span>
            </v-tooltip>
          </DemoSection>

          <DemoSection title="Keyboard shortcut" subtitle="Shortcut hint on hover">
            <v-tooltip location="right">
              <template #activator="{ props: activatorProps }">
                <v-btn v-bind="activatorProps" variant="outlined" icon="mdi-command" aria-label="Global search" />
              </template>
              <div class="row">
                <span>Global search</span>
                <v-kbd>⌘</v-kbd>
                <v-kbd>K</v-kbd>
              </div>
            </v-tooltip>
          </DemoSection>

          <DemoSection title="Security note" subtitle="Longer explanatory content">
            <v-tooltip location="top" :max-width="220" text="Only you can read this conversation. Even the developers cannot access it.">
              <template #activator="{ props: activatorProps }">
                <v-chip
                  v-bind="activatorProps"
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-shield-check-outline"
                >
                  End-to-end encrypted
                </v-chip>
              </template>
            </v-tooltip>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Tour -->
      <v-window-item value="tour">
        <DemoSection title="Guided tour" subtitle="Two-step walkthrough with a modal">
          <div class="row">
            <v-btn color="success" prepend-icon="mdi-map-marker-path" @click="startTour">
              Start tour
            </v-btn>
            <span class="demo-note">
              Step {{ tourStep + 1 }} of {{ tourSteps.length }} · {{ tourOpen ? 'running' : 'idle' }}
            </span>
          </div>
          <div class="tour-stage">
            <v-card
              class="tour-target"
              :class="{ 'is-highlighted': tourOpen && tourStep === 0 }"
              variant="outlined"
            >
              <v-card-text class="row between">
                <div>
                  <div class="timeline-title">Main action</div>
                  <div class="demo-note">The primary button for the form.</div>
                </div>
                <v-btn color="primary" @click="tourAction = 'Form submitted'">Submit</v-btn>
              </v-card-text>
            </v-card>
            <div class="tour-target" :class="{ 'is-highlighted': tourOpen && tourStep === 1 }">
              <v-text-field
                v-model="tourAction"
                prepend-inner-icon="mdi-magnify"
                label="Search box"
                density="comfortable"
                hide-details
              />
            </div>
            <div class="demo-note" v-if="tourAction">Last action: {{ tourAction }}</div>
          </div>
        </DemoSection>

        <DemoSection title="Tour steps" subtitle="Ordered steps highlight one target at a time">
          <v-list density="comfortable">
            <v-list-item v-for="(step, index) in tourSteps" :key="step.title">
              <template #prepend>
                <v-avatar
                  :color="tourOpen && tourStep === index ? 'success' : undefined"
                  :variant="tourOpen && tourStep === index ? 'flat' : 'tonal'"
                  size="32"
                >
                  <span class="text-caption">{{ index + 1 }}</span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ step.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ step.text }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <p class="demo-note">
            Start the tour to launch the modal, then step through the highlighted targets.
          </p>
        </DemoSection>

        <v-dialog v-model="tourOpen" max-width="520" persistent>
          <v-card>
            <v-card-item>
              <template #prepend>
                <v-avatar color="success" variant="tonal" size="40">
                  <span class="text-body-2">{{ tourStep + 1 }}</span>
                </v-avatar>
              </template>
              <v-card-title>{{ tourSteps[tourStep]?.title }}</v-card-title>
              <v-card-subtitle>Guided tour · step {{ tourStep + 1 }} of {{ tourSteps.length }}</v-card-subtitle>
            </v-card-item>
            <v-card-text>{{ tourSteps[tourStep]?.text }}</v-card-text>
            <v-card-actions>
              <v-btn variant="text" @click="tourOpen = false">Skip</v-btn>
              <v-spacer />
              <v-btn variant="text" :disabled="tourStep === 0" @click="previousTourStep">Back</v-btn>
              <v-btn color="success" @click="nextTourStep">
                {{ tourStep === tourSteps.length - 1 ? 'Finish' : 'Next' }}
              </v-btn>
            </v-card-actions>
            <v-progress-linear
              :model-value="((tourStep + 1) / tourSteps.length) * 100"
              color="success"
              height="4"
            />
          </v-card>
        </v-dialog>
      </v-window-item>
    </v-window>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.row.align-end {
  align-items: flex-end;
}

.row.between {
  justify-content: space-between;
}

.row.end {
  justify-content: flex-end;
}

.row.center-row {
  justify-content: center;
}

.display-window {
  padding-top: 4px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-summary {
  margin-top: 4px;
}

.date-large {
  font-size: 18px;
  font-weight: 700;
}

.range-pickers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

@media (max-width: 720px) {
  .range-pickers {
    grid-template-columns: minmax(0, 1fr);
  }
}

.badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-row :deep(.v-badge__badge) {
  height: 24px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
}

.badge-gap {
  gap: 28px;
}

.badge-list {
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
}

.media-card {
  overflow: hidden;
}

.nav-card {
  height: 100%;
}

.nav-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.nav-card-title {
  font-size: 14px;
  font-weight: 650;
}

.nav-card-text {
  min-height: 34px;
}

.carousel-slide {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface-variant));
}

.carousel-number {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-number {
  font-size: 44px;
  font-weight: 700;
}

.carousel-caption {
  padding: 12px 18px;
  text-align: center;
}

.carousel-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.carousel-text {
  font-size: 13px;
  color: rgb(255 255 255 / 0.82);
}

.image-overlay {
  position: absolute;
  inset: auto 0 0;
  padding: 16px;
  background: linear-gradient(to top, rgb(0 0 0 / 0.7), transparent);
}

.custom-trigger {
  font-weight: 650;
}

.desc-table {
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
}

.desc-label {
  width: 150px;
  font-weight: 600;
  white-space: nowrap;
}

.desc-bordered :deep(th),
.desc-bordered :deep(td) {
  border: 1px solid rgb(var(--v-border-color));
}

.center-card {
  height: 100%;
}

.center-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.empty-badge {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
}

.surface-strip {
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.avatar-stack {
  display: flex;
}

.stacked {
  border: 2px solid rgb(var(--v-theme-surface));
}

.stacked + .stacked {
  margin-left: -12px;
}

.person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.popover-card {
  margin-top: 4px;
}

.switch-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.direction-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 64px;
}

.qr-card {
  height: 100%;
}

.qr-center {
  display: flex;
  justify-content: center;
  padding-top: 0;
}

.qr-svg {
  display: block;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgb(var(--v-border-color));
}

.qr-sizes {
  gap: 26px;
}

.qr-size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.qr-builder {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .qr-builder {
    grid-template-columns: minmax(0, 1fr);
  }
}

.qr-controls {
  height: 100%;
}

.qr-colors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.color-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-field input {
  width: 100%;
  height: 32px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 6px;
  background: transparent;
}

.qr-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  min-height: 280px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
  overflow: auto;
}

.segment-error :deep(.v-btn) {
  border-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-error));
}

.error-text {
  margin-top: 6px;
  font-size: 12px;
  color: rgb(var(--v-theme-error));
}

.tag-editor {
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.timeline-time {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.timeline-title {
  font-size: 13px;
  font-weight: 650;
}

.timeline-text {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.clickable {
  cursor: pointer;
}

.timeline-scroll {
  overflow-x: auto;
  padding-bottom: 8px;
}

.horizontal-step {
  max-width: 210px;
}

.tooltip-stage {
  padding: 24px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.tooltip-card {
  background: rgb(var(--v-theme-surface));
}

.cursor-pointer {
  cursor: pointer;
}

.link-text {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.tour-stage {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed rgb(var(--v-border-color));
}

.tour-target {
  border-radius: 10px;
  transition: outline-color 0.2s ease;
  outline: 2px solid transparent;
  outline-offset: 4px;
}

.tour-target.is-highlighted {
  outline-color: rgb(var(--v-theme-success));
}
</style>
