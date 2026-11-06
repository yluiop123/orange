<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const ui = useUiStore()
const title = usePageTitle('page.title.component')

const tab = ref('autocomplete')

const required = (value: unknown): true | string =>
  Boolean(String(value ?? '').trim()) || 'Required'
const emailRule = (value: unknown): true | string =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '')) || 'Invalid email'
const minLength = (length: number) => (value: unknown): true | string =>
  String(value ?? '').length >= length || `At least ${length} characters`

/* AutoComplete ------------------------------------------------------------ */
const acBasic = ref<string | null>(null)
const acBasicSearch = ref('')
const acBasicOptions = computed(() => {
  const value = acBasicSearch.value
  return value ? [value, value.repeat(2), value.repeat(3)] : []
})
function onBasicSearch(value: string | null) {
  acBasicSearch.value = value ?? ''
}

const acControlled = ref<string | null>(null)
const acFruits = ['Apple', 'Banana', 'Cherry']

const acCustom = ref<string | null>(null)
const acTechOptions = [
  { title: 'Vue', subtitle: 'Progressive framework', value: 'vue', icon: 'mdi-vuejs' },
  { title: 'React', subtitle: 'Component library', value: 'react', icon: 'mdi-react' },
  { title: 'Spring Boot', subtitle: 'Java backend', value: 'spring', icon: 'mdi-leaf' },
]

const acAsync = ref<string | null>(null)
const acAsyncOptions = ref<string[]>([])
const acLoading = ref(false)
let asyncTimer: number | undefined
function onAsyncSearch(value: string | null) {
  if (asyncTimer) window.clearTimeout(asyncTimer)
  const term = value ?? ''
  if (!term) {
    acAsyncOptions.value = []
    acLoading.value = false
    return
  }
  acLoading.value = true
  asyncTimer = window.setTimeout(() => {
    acAsyncOptions.value = [`${term}@gmail.com`, `${term}@outlook.com`, `${term}@qq.com`]
    acLoading.value = false
  }, 800)
}

const acSize = ref<string | null>(null)
const acWarning = ref<string | null>(null)
const acError = ref<string | null>(null)

/* Cascader ---------------------------------------------------------------- */
const cascadeTree = [
  {
    value: 'clothes',
    label: '服装',
    children: [
      { value: 'mens', label: '男装', children: [{ value: 'tshirt', label: 'T恤' }, { value: 'suit', label: '西装' }] },
      { value: 'womens', label: '女装', children: [{ value: 'dress', label: '连衣裙' }] },
    ],
  },
  {
    value: 'food',
    label: '食物',
    children: [
      { value: 'fruit', label: '水果', children: [{ value: 'apple', label: '苹果' }, { value: 'banana', label: '香蕉' }] },
      { value: 'vegetables', label: '蔬菜', children: [{ value: 'carrot', label: '胡萝卜' }, { value: 'broccoli', label: '西兰花' }] },
    ],
  },
]
const cascadeRoot = ref('clothes')
const cascadeChild = ref('mens')
const cascadeLeaf = ref('tshirt')
const cascadeRootOptions = cascadeTree.map((node) => ({ title: node.label, value: node.value }))
const cascadeChildren = computed(
  () => cascadeTree.find((node) => node.value === cascadeRoot.value)?.children ?? [],
)
const cascadeChildOptions = computed(() =>
  cascadeChildren.value.map((node) => ({ title: node.label, value: node.value })),
)
const cascadeLeaves = computed(
  () => cascadeChildren.value.find((node) => node.value === cascadeChild.value)?.children ?? [],
)
const cascadeLeafOptions = computed(() =>
  cascadeLeaves.value.map((node) => ({ title: node.label, value: node.value })),
)
watch(cascadeRoot, () => {
  const firstChild = cascadeChildren.value[0]
  cascadeChild.value = firstChild?.value ?? ''
  cascadeLeaf.value = firstChild?.children?.[0]?.value ?? ''
})
watch(cascadeChild, () => {
  cascadeLeaf.value = cascadeLeaves.value[0]?.value ?? ''
})
const cascadePath = computed(() => {
  const root = cascadeTree.find((node) => node.value === cascadeRoot.value)
  const child = root?.children.find((node) => node.value === cascadeChild.value)
  const leaf = child?.children?.find((node) => node.value === cascadeLeaf.value)
  return [root?.label, child?.label, leaf?.label].filter(Boolean)
})
const cascadeLeavesAll = cascadeTree.flatMap((node) =>
  node.children.flatMap((child) =>
    (child.children ?? []).map((leaf) => ({ title: `${node.label} / ${child.label} / ${leaf.label}`, value: leaf.value })),
  ),
)
const cascadeMulti = ref<string[]>(['apple', 'banana'])

/* Checkbox ---------------------------------------------------------------- */
const stackItems = [
  { id: 'react', label: 'React.js' },
  { id: 'vue', label: 'Vue.js' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'tailwind', label: 'Tailwind CSS' },
]
const checkedStack = ref<string[]>([])
const checkedState = ref(true)

/* ColorPicker ------------------------------------------------------------- */
const color = ref('#3b82f6')
const accentColor = ref('#22c55e')
const colorPresets = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#18181b']

/* DatePicker -------------------------------------------------------------- */
const birthday = ref('1996-08-16')
const calendarDate = ref(new Date(1996, 7, 16))
const eventTime = ref('12:00')
const rangeFrom = ref('2026-11-01')
const rangeTo = ref('2026-11-20')
const rangeValid = computed(() => Boolean(rangeFrom.value && rangeTo.value && rangeTo.value >= rangeFrom.value))

watch(calendarDate, (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  birthday.value = `${year}-${month}-${day}`
})

watch(birthday, (value) => {
  const parsed = value ? new Date(`${value}T00:00:00`) : null
  if (parsed && !Number.isNaN(parsed.getTime())) {
    calendarDate.value = parsed
  }
})

/* Form -------------------------------------------------------------------- */
const profile = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const profileValid = ref(false)
const profileLoading = ref(false)
const matchesPassword = (value: unknown): true | string =>
  value === profile.password || 'Passwords do not match'
async function submitProfile() {
  if (!profileValid.value) {
    ui.notify('Please fix the form errors', 'warning')
    return
  }
  profileLoading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 1500))
  profileLoading.value = false
  ui.notify('注册成功 / Registration Successful', 'success')
  profile.username = ''
  profile.email = ''
  profile.password = ''
  profile.confirmPassword = ''
  profileValid.value = false
}
function resetProfile() {
  profile.username = ''
  profile.email = ''
  profile.password = ''
  profile.confirmPassword = ''
  profileValid.value = false
}

/* Input ------------------------------------------------------------------- */
const input = reactive({ username: '', email: '', password: '', phone: '' })
const inputValid = ref(false)
const showPassword = ref(false)
const inputLoading = ref(false)
const phoneRule = (value: unknown): true | string =>
  /^[\d\s\-+()]+$/.test(String(value ?? '')) || 'Please enter a valid phone number'
const maxLength20 = (value: unknown): true | string =>
  String(value ?? '').length <= 20 || 'At most 20 characters'
async function submitInput() {
  if (!inputValid.value) {
    ui.notify('Please fix the form errors', 'warning')
    return
  }
  inputLoading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 1200))
  inputLoading.value = false
  ui.notify('提交成功 / Submitted Successfully', 'success')
  input.username = ''
  input.email = ''
  input.password = ''
  input.phone = ''
  inputValid.value = false
}

/* InputNumber ------------------------------------------------------------- */
const numberBasic = ref<number | null>(5)
const numberStep = ref<number | null>(10)
const numberFull = ref<number | null>(5)
const numberInt = ref<number | null>(42)
const numberPrice = ref<number | null>(99.99)
const numberForm = reactive({ age: 25, price: 99.99, quantity: 1, discount: 10 })
const numberLoading = ref(false)
const budget = computed(
  () =>
    Number(numberForm.price) *
    Number(numberForm.quantity) *
    (1 - Number(numberForm.discount) / 100),
)
async function submitNumbers() {
  numberLoading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 1200))
  numberLoading.value = false
  ui.notify('提交成功 / Submitted Successfully', 'success')
}

/* Mentions ---------------------------------------------------------------- */
const mentionUsers = [
  { value: 'user1', label: '张三 / Zhang San', description: '产品经理 / Product Manager' },
  { value: 'user2', label: '李四 / Li Si', description: '设计师 / Designer' },
  { value: 'user3', label: '王五 / Wang Wu', description: '开发者 / Developer' },
  { value: 'user4', label: '赵六 / Zhao Liu', description: '测试工程师 / QA Engineer' },
]
const mentionText = ref('')
const mentionedLabels = ref<string[]>([])
const mentionLoading = ref(false)
let mentionTimer: number | undefined
function insertMention(label: string) {
  const spacer = mentionText.value && !mentionText.value.endsWith(' ') ? ' ' : ''
  mentionText.value = `${mentionText.value}${spacer}@${label} `
  if (!mentionedLabels.value.includes(label)) mentionedLabels.value.push(label)
}
function loadMentionUsers() {
  if (mentionTimer) window.clearTimeout(mentionTimer)
  mentionLoading.value = true
  mentionTimer = window.setTimeout(() => {
    mentionLoading.value = false
    ui.notify('用户加载完成 / Users loaded successfully', 'success')
  }, 1600)
}

/* Radio ------------------------------------------------------------------- */
const radioBasic = ref('option1')
const radioPayment = ref('credit-card')
const radioPlan = ref('basic')
const radioNotification = ref('all')
const radioState = ref('enabled')
const radioPlans = [
  { value: 'basic', title: '基础套餐 / Basic Plan', description: '包含基本功能，适合个人用户', price: '¥99/月' },
  { value: 'pro', title: '专业套餐 / Pro Plan', description: '更多高级功能，适合团队使用', price: '¥299/月' },
  { value: 'enterprise', title: '企业套餐 / Enterprise Plan', description: '完整功能，可自定义，适合大型企业', price: '自定义' },
]

/* Rate -------------------------------------------------------------------- */
const ratingDefault = ref(3)
const ratingFour = ref(4)
const ratingHalf = ref(2.5)
const ratingTen = ref(7)
const ratingHeart = ref(3)
const ratingDisabled = ref(4)
const ratingControlled = ref(3)
const ratingSatisfaction = ref(0)
const ratingQuality = ref(0)
const ratingService = ref(0)
const ratingLoading = ref(false)
async function submitRating() {
  if (!ratingSatisfaction.value) {
    ui.notify('请评分 / Please rate your satisfaction', 'warning')
    return
  }
  ratingLoading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 1200))
  ratingLoading.value = false
  ui.notify('评分提交成功 / Rating submitted successfully', 'success')
}

/* Select ------------------------------------------------------------------ */
const countries = [
  { title: '中国 / China', value: 'cn' },
  { title: '美国 / United States', value: 'us' },
  { title: '英国 / United Kingdom', value: 'uk' },
  { title: '日本 / Japan', value: 'jp' },
  { title: '德国 / Germany', value: 'de' },
]
const languages = [
  { title: '中文 / Chinese', value: 'zh' },
  { title: '英文 / English', value: 'en' },
  { title: '日文 / Japanese', value: 'ja' },
  { title: '德文 / German', value: 'de' },
]
const departments = [
  { title: '前端 / Frontend', value: 'frontend' },
  { title: '后端 / Backend', value: 'backend' },
  { title: '设计 / Design', value: 'design' },
  { title: '产品 / Product', value: 'product' },
  { title: '人力资源 / HR', value: 'hr' },
]
const categoryItems = [
  { type: 'subheader', title: '基础 / Basic' },
  { title: '文本 / Text', value: 'text' },
  { title: '数字 / Number', value: 'number' },
  { title: '日期 / Date', value: 'date' },
  { type: 'subheader', title: '高级 / Advanced' },
  { title: '文件 / File', value: 'file' },
  { title: 'JSON', value: 'json' },
  { title: 'API', value: 'api' },
]
const disabledDepartments = departments.map((item) => ({
  ...item,
  props: { disabled: item.value === 'backend' },
}))
const selectCountry = ref('cn')
const selectLanguage = ref('en')
const selectControlled = ref<string | null>(null)
const selectCategory = ref('text')
const selectDepartment = ref('frontend')
const selectMulti = ref<string[]>(['frontend', 'design'])
const selectCity = ref('bj')

/* Slider ------------------------------------------------------------------ */
const volume = ref(50)
const brightness = ref(70)
const priceRange = ref([20, 80])
const temperature = ref(20)
const sliderSnapshot = computed(() =>
  JSON.stringify(
    {
      volume: volume.value,
      brightness: brightness.value,
      priceRange: priceRange.value,
      temperature: temperature.value,
    },
    null,
    2,
  ),
)
const sliderLoading = ref(false)
async function saveSliders() {
  sliderLoading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 1000))
  sliderLoading.value = false
  ui.notify('配置已保存 / Settings saved', 'success')
}

/* Switch ------------------------------------------------------------------ */
const newsletter = ref(true)
const notifications = ref(false)
const terms = ref(false)
const darkPreview = ref(false)
const switchLoading = ref(false)
async function saveSwitches() {
  if (!terms.value) {
    ui.notify('请同意条款 / Please accept terms', 'warning')
    return
  }
  switchLoading.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  switchLoading.value = false
  ui.notify('设置已保存 / Settings saved', 'success')
}

/* TimePicker -------------------------------------------------------------- */
const meetingTime = ref('09:30')
const clockTime = ref<string | null>('10:15')
const startTime = ref('09:00')
const endTime = ref('17:00')
const secondTime = ref<string | null>('12:00:30')

/* Transfer ---------------------------------------------------------------- */
type TransferItem = { key: string; title: string; description: string; disabled: boolean }
const transferItems: TransferItem[] = Array.from({ length: 12 }).map((_, index) => ({
  key: String(index + 1),
  title: `Item ${index + 1}`,
  description: `描述 / Description ${index + 1}`,
  disabled: index % 7 === 0,
}))
const targetKeys = ref<string[]>(['2', '5'])
const transferSearch = ref('')
const sourceSelected = ref<string[]>([])
const targetSelected = ref<string[]>([])
const availableItems = computed(() => transferItems.filter((item) => !targetKeys.value.includes(item.key)))
const targetItems = computed(() => transferItems.filter((item) => targetKeys.value.includes(item.key)))
const filteredAvailable = computed(() => {
  const term = transferSearch.value.trim().toLowerCase()
  return term
    ? availableItems.value.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(term))
    : availableItems.value
})
const filteredTarget = computed(() => {
  const term = transferSearch.value.trim().toLowerCase()
  return term
    ? targetItems.value.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(term))
    : targetItems.value
})
function moveToTarget() {
  targetKeys.value = [...new Set([...targetKeys.value, ...sourceSelected.value])]
  sourceSelected.value = []
}
function moveToSource() {
  targetKeys.value = targetKeys.value.filter((key) => !targetSelected.value.includes(key))
  targetSelected.value = []
}
const transferSaving = ref(false)
async function saveTransfer() {
  transferSaving.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  transferSaving.value = false
  ui.notify('保存成功 / Saved', 'success')
}

/* TreeSelect -------------------------------------------------------------- */
type TreeNode = { value: string; title: string; children?: TreeNode[] }
const treeData: TreeNode[] = [
  {
    value: 'asia',
    title: 'Asia / 亚洲',
    children: [
      { value: 'cn', title: 'China / 中国' },
      { value: 'jp', title: 'Japan / 日本' },
      { value: 'in', title: 'India / 印度' },
    ],
  },
  {
    value: 'europe',
    title: 'Europe / 欧洲',
    children: [
      { value: 'de', title: 'Germany / 德国' },
      { value: 'fr', title: 'France / 法国' },
      {
        value: 'uk',
        title: 'UK / 英国',
        children: [
          { value: 'eng', title: 'England / 英格兰' },
          { value: 'sct', title: 'Scotland / 苏格兰' },
        ],
      },
    ],
  },
  {
    value: 'americas',
    title: 'Americas / 美洲',
    children: [
      { value: 'us', title: 'United States / 美国' },
      { value: 'ca', title: 'Canada / 加拿大' },
    ],
  },
]
function findPath(nodes: TreeNode[], value: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const next = [...path, node.title]
    if (node.value === value) return next
    if (node.children) {
      const result = findPath(node.children, value, next)
      if (result) return result
    }
  }
  return null
}
const treeRegion = ref('asia')
const treeCountry = ref('cn')
const treeRegionOptions = treeData.map((node) => ({ title: node.title, value: node.value }))
const treeRegionCountries = computed(
  () => treeData.find((node) => node.value === treeRegion.value)?.children ?? [],
)
const treeCountryOptions = computed(() =>
  treeRegionCountries.value.map((node) => ({ title: node.title, value: node.value })),
)
watch(treeRegion, () => {
  treeCountry.value = treeRegionCountries.value[0]?.value ?? ''
})
const treeSelected = ref<string[]>(['cn', 'de'])
const treeSelectedPaths = computed(() =>
  treeSelected.value
    .map((value) => findPath(treeData, value))
    .filter((path): path is string[] => path !== null)
    .map((path) => ({ value: path[path.length - 1], path: path.join(' > ') })),
)
function selectAllTree() {
  treeSelected.value = treeData.flatMap((node) =>
    (node.children ?? []).flatMap((child) =>
      child.children ? child.children.map((leaf) => leaf.value) : [child.value],
    ),
  )
}
const remoteTree = ref<TreeNode[] | null>(null)
const treeLoading = ref(false)
const treeError = ref('')
let treeTimer: number | undefined
function loadRemoteTree(fail = false) {
  if (treeTimer) window.clearTimeout(treeTimer)
  treeLoading.value = true
  treeError.value = ''
  remoteTree.value = null
  treeTimer = window.setTimeout(() => {
    if (fail) {
      treeError.value = 'Failed to fetch / 加载失败'
    } else {
      remoteTree.value = treeData
    }
    treeLoading.value = false
  }, 900)
}

/* Upload ------------------------------------------------------------------ */
const uploadFiles = ref<File[]>([])
const uploadProgress = ref(0)
const uploading = ref(false)
let uploadTimer: number | undefined
const uploadTotalKb = computed(() =>
  uploadFiles.value.reduce((total, file) => total + file.size / 1024, 0).toFixed(0),
)
function startUpload() {
  if (!uploadFiles.value.length || uploading.value) return
  uploading.value = true
  uploadProgress.value = 0
  uploadTimer = window.setInterval(() => {
    uploadProgress.value = Math.min(100, uploadProgress.value + 20)
    if (uploadProgress.value >= 100) {
      if (uploadTimer) window.clearInterval(uploadTimer)
      uploading.value = false
      ui.notify('上传完成 / Upload complete', 'success')
    }
  }, 300)
}
function cancelUpload() {
  if (uploadTimer) window.clearInterval(uploadTimer)
  uploading.value = false
  uploadProgress.value = 0
}
function removeFile(index: number) {
  uploadFiles.value.splice(index, 1)
}

onBeforeUnmount(() => {
  if (asyncTimer) window.clearTimeout(asyncTimer)
  if (mentionTimer) window.clearTimeout(mentionTimer)
  if (treeTimer) window.clearTimeout(treeTimer)
  if (uploadTimer) window.clearInterval(uploadTimer)
})
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.form')" />

    <v-tabs v-model="tab" class="demo-tabs demo-tabs--scroll">
      <v-tab value="autocomplete">AutoComplete</v-tab>
      <v-tab value="cascader">Cascader</v-tab>
      <v-tab value="checkbox">Checkbox</v-tab>
      <v-tab value="colorpicker">ColorPicker</v-tab>
      <v-tab value="datepicker">DatePicker</v-tab>
      <v-tab value="form">Form</v-tab>
      <v-tab value="input">Input</v-tab>
      <v-tab value="input-number">InputNumber</v-tab>
      <v-tab value="mentions">Mentions</v-tab>
      <v-tab value="radio">Radio</v-tab>
      <v-tab value="rate">Rate</v-tab>
      <v-tab value="select">Select</v-tab>
      <v-tab value="slider">Slider</v-tab>
      <v-tab value="switch">Switch</v-tab>
      <v-tab value="timepicker">TimePicker</v-tab>
      <v-tab value="transfer">Transfer</v-tab>
      <v-tab value="treeselect">TreeSelect</v-tab>
      <v-tab value="upload">Upload</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- AutoComplete ------------------------------------------------------ -->
      <v-window-item value="autocomplete">
        <div class="tab-pane">
          <DemoSection title="搜索 / Search" subtitle="Free-text options and debounced async loading">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="acBasic"
                  :items="acBasicOptions"
                  label="输入内容 / Input here"
                  clearable
                  no-data-text="Type to search..."
                  @update:search="onBasicSearch"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="acAsync"
                  :items="acAsyncOptions"
                  :loading="acLoading"
                  label="输入邮箱前缀 / Async email"
                  clearable
                  no-data-text="Keep typing..."
                  @update:search="onAsyncSearch"
                />
              </v-col>
            </v-row>
          </DemoSection>

          <div class="demo-grid demo-grid--2">
            <DemoSection title="受控模式 / Controlled" subtitle="Selected value is reflected below">
              <v-autocomplete v-model="acControlled" :items="acFruits" label="选择水果 / Select fruit" clearable />
              <div class="demo-note">当前值 / Current value: {{ acControlled || '-' }}</div>
            </DemoSection>

            <DemoSection title="自定义选项 / Custom Option" subtitle="Custom icon and subtitle per option">
              <v-autocomplete v-model="acCustom" :items="acTechOptions" label="选择技术栈 / Select tech">
                <template #item="{ props: itemProps, item }">
                  <v-list-item
                    v-bind="itemProps"
                    :subtitle="item.raw.subtitle"
                    :prepend-icon="item.raw.icon"
                  />
                </template>
              </v-autocomplete>
            </DemoSection>
          </div>

          <DemoSection title="尺寸 & 状态 / Size & Status" subtitle="Density and validation feedback">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-autocomplete v-model="acSize" :items="['Small', 'Medium', 'Large']" label="Small" density="compact" hide-details />
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="acWarning"
                  :items="['Small', 'Medium', 'Large']"
                  label="Warning"
                  density="default"
                  hint="Please double-check this value"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="acError"
                  :items="['Small', 'Medium', 'Large']"
                  label="Error"
                  density="comfortable"
                  error-messages="This field is required"
                />
              </v-col>
            </v-row>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Cascader ---------------------------------------------------------- -->
      <v-window-item value="cascader">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="单选模式 / Single" subtitle="Nested selects emulate a cascader">
              <v-select v-model="cascadeRoot" :items="cascadeRootOptions" label="一级分类 / Level 1" hide-details />
              <v-select v-model="cascadeChild" :items="cascadeChildOptions" label="二级分类 / Level 2" hide-details />
              <v-select v-model="cascadeLeaf" :items="cascadeLeafOptions" label="三级分类 / Level 3" hide-details />
              <v-chip color="primary" variant="tonal">Path: {{ cascadePath.join(' / ') || '-' }}</v-chip>
            </DemoSection>

            <DemoSection title="多选模式 / Multiple" subtitle="Choose any leaf nodes">
              <v-select
                v-model="cascadeMulti"
                :items="cascadeLeavesAll"
                label="支持多选节点 / Multiple nodes"
                multiple
                chips
                closable-chips
              />
              <div class="demo-note">Multiple count: {{ cascadeMulti.length }}</div>
            </DemoSection>
          </div>

          <DemoSection title="选项树 / Options tree" subtitle="Same data rendered as a compact tree">
            <v-list density="compact" class="tree-list">
              <template v-for="node in cascadeTree" :key="node.value">
                <v-list-item :title="node.label" prepend-icon="mdi-folder-outline" />
                <template v-for="child in node.children" :key="child.value">
                  <v-list-item class="tree-child" :title="child.label" prepend-icon="mdi-folder-open-outline" />
                  <v-list-item
                    v-for="leaf in child.children"
                    :key="leaf.value"
                    class="tree-leaf"
                    :title="leaf.label"
                    prepend-icon="mdi-file-outline"
                  />
                </template>
              </template>
            </v-list>
          </DemoSection>

          <DemoSection title="自定义边框 / Custom border" subtitle="Styling a single select">
            <v-select
              v-model="cascadeRoot"
              :items="cascadeRootOptions"
              label="紫色边框 / Purple border"
              class="purple-select"
              hide-details
            />
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Checkbox ---------------------------------------------------------- -->
      <v-window-item value="checkbox">
        <div class="tab-pane">
          <DemoSection title="选择你的技术栈 / Select Stack" subtitle="Array v-model with value per checkbox">
            <v-checkbox
              v-for="item in stackItems"
              :key="item.id"
              v-model="checkedStack"
              :value="item.id"
              :label="item.label"
              density="compact"
              hide-details
            />
            <v-divider class="my-2" />
            <div class="demo-note">Selected: {{ checkedStack.length ? checkedStack.join(', ') : 'No selection' }}</div>
            <div v-if="checkedStack.length" class="chip-row">
              <v-chip v-for="id in checkedStack" :key="id" size="small" color="primary" variant="tonal">{{ id }}</v-chip>
            </div>
          </DemoSection>

          <div class="demo-grid demo-grid--2">
            <DemoSection title="状态 / States" subtitle="Checked, indeterminate and disabled">
              <v-checkbox v-model="checkedState" label="Checked" color="primary" hide-details />
              <v-checkbox :model-value="true" label="Checked + disabled" disabled hide-details />
              <v-checkbox :model-value="false" :indeterminate="true" label="Indeterminate" hide-details />
              <v-checkbox :model-value="false" label="Unchecked" hide-details />
            </DemoSection>

            <DemoSection title="内联布局 / Inline" subtitle="Compact checkbox buttons">
              <div class="chip-row">
                <v-checkbox-btn v-model="checkedStack" value="vue" label="Vue" />
                <v-checkbox-btn v-model="checkedStack" value="react" label="React" />
                <v-checkbox-btn v-model="checkedStack" value="svelte" label="Svelte" />
              </div>
              <pre class="code-block">{{ JSON.stringify(checkedStack) }}</pre>
            </DemoSection>
          </div>
        </div>
      </v-window-item>

      <!-- ColorPicker ------------------------------------------------------- -->
      <v-window-item value="colorpicker">
        <div class="tab-pane">
          <DemoSection title="背景颜色设置 / Background Setting" subtitle="Native color input + live preview">
            <div class="color-row">
              <input v-model="color" type="color" class="native-color" aria-label="Pick background color" />
              <v-text-field v-model="color" label="HEX" density="compact" hide-details style="max-width: 200px" />
              <v-chip variant="tonal">{{ color }}</v-chip>
            </div>
            <div class="swatch-large" :style="{ backgroundColor: color }">{{ color }}</div>
          </DemoSection>

          <DemoSection title="预设色板 / Presets" subtitle="Click a swatch to apply it">
            <div class="swatch-grid">
              <button
                v-for="preset in colorPresets"
                :key="preset"
                type="button"
                class="swatch"
                :class="{ 'swatch--active': preset === color }"
                :style="{ backgroundColor: preset }"
                :aria-label="preset"
                @click="color = preset"
              />
            </div>
          </DemoSection>

          <DemoSection title="双色渐变 / Two-tone preview" subtitle="Background and accent colors combine">
            <v-row dense>
              <v-col cols="12" md="6">
                <div class="color-row">
                  <input v-model="accentColor" type="color" class="native-color" aria-label="Pick accent color" />
                  <span class="demo-note">Accent: {{ accentColor }}</span>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="gradient-preview" :style="{ background: `linear-gradient(135deg, ${color}, ${accentColor})` }">
                  Gradient preview
                </div>
              </v-col>
            </v-row>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- DatePicker -------------------------------------------------------- -->
      <v-window-item value="datepicker">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="出生日期 / Birthday" subtitle="Pick a date from the calendar">
              <v-date-picker v-model="calendarDate" show-adjacent-months class="date-picker" />
              <v-text-field v-model="birthday" label="Birthday" type="date" prepend-inner-icon="mdi-calendar" />
            </DemoSection>

            <div class="stack-col">
              <DemoSection title="活动时间 / Event Time" subtitle="Native time input with icon">
                <v-text-field
                  v-model="eventTime"
                  label="Event Time / 活动具体时间"
                  type="time"
                  prepend-inner-icon="mdi-clock-outline"
                  hint="Will be combined with the date above"
                  persistent-hint
                />
              </DemoSection>

              <DemoSection title="项目周期 / Project Duration" subtitle="End must be after start">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="rangeFrom" label="From" type="date" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="rangeTo" label="To" type="date" />
                  </v-col>
                </v-row>
                <v-alert
                  :type="rangeValid ? 'success' : 'error'"
                  density="compact"
                  variant="tonal"
                >
                  {{ rangeValid ? '日期区间有效 / Valid date range' : '结束日期必须晚于开始日期 / End date must be after start date' }}
                </v-alert>
              </DemoSection>
            </div>
          </div>
        </div>
      </v-window-item>

      <!-- Form -------------------------------------------------------------- -->
      <v-window-item value="form">
        <div class="tab-pane">
          <DemoSection title="创建账户 / Create Account" subtitle="v-form with validation rules and loading state">
            <v-form v-model="profileValid" @submit.prevent="submitProfile">
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.username"
                    label="用户名 / Username"
                    placeholder="Nickname..."
                    :rules="[required, minLength(2)]"
                    prepend-inner-icon="mdi-account-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.email"
                    label="电子邮箱 / Email Address"
                    placeholder="example@domain.com"
                    :rules="[required, emailRule]"
                    prepend-inner-icon="mdi-email-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.password"
                    label="密码 / Password"
                    type="password"
                    :rules="[required, minLength(8)]"
                    hint="At least 8 characters"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.confirmPassword"
                    label="确认密码 / Confirm Password"
                    type="password"
                    :rules="[required, matchesPassword]"
                  />
                </v-col>
              </v-row>
              <div class="form-actions">
                <v-btn variant="text" @click="resetProfile">Reset</v-btn>
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="profileLoading"
                  prepend-icon="mdi-content-save-outline"
                >
                  Submit Registration
                </v-btn>
              </div>
            </v-form>
          </DemoSection>

          <DemoSection title="校验状态 / Validation state" subtitle="Reactive flags exposed by v-form">
            <div class="chip-row">
              <v-chip :color="profileValid ? 'success' : 'warning'" variant="tonal">
                {{ profileValid ? 'Form is valid' : 'Form has errors' }}
              </v-chip>
              <v-chip variant="tonal">username: {{ profile.username || '—' }}</v-chip>
              <v-chip variant="tonal">email: {{ profile.email || '—' }}</v-chip>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Input ------------------------------------------------------------- -->
      <v-window-item value="input">
        <div class="tab-pane">
          <DemoSection title="表单验证示例 / Form Validation" subtitle="Field-style layout with rules">
            <v-form v-model="inputValid" @submit.prevent="submitInput">
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="input.username"
                    label="用户名 / Username"
                    placeholder="2-20 个字符"
                    :rules="[required, minLength(2), maxLength20]"
                    prepend-inner-icon="mdi-account-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="input.email"
                    label="邮箱地址 / Email Address"
                    type="email"
                    placeholder="example@email.com"
                    :rules="[required, emailRule]"
                    prepend-inner-icon="mdi-email-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="input.password"
                    label="密码 / Password"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :rules="[required, minLength(8)]"
                    @click:append-inner="showPassword = !showPassword"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="input.phone"
                    label="电话 / Phone"
                    placeholder="+86 138 0000 0000"
                    :rules="[required, phoneRule]"
                    prepend-inner-icon="mdi-phone-outline"
                  />
                </v-col>
              </v-row>
              <div class="form-actions">
                <v-btn color="primary" type="submit" :loading="inputLoading">提交表单 / Submit</v-btn>
              </div>
            </v-form>
          </DemoSection>

          <div class="demo-grid demo-grid--2">
            <DemoSection title="输入状态 / States" subtitle="Prefix, disabled, error and textarea">
              <v-text-field label="With prefix" prefix="¥" model-value="1,280" />
              <v-text-field label="Disabled" disabled model-value="Read only" />
              <v-text-field label="Error state" error-messages="This field is required" model-value="" />
              <v-textarea label="Bio" rows="3" auto-grow model-value="Front-end engineer working on the admin console." />
            </DemoSection>

            <DemoSection title="后缀与计数器 / Suffix & counter" subtitle="Adornments and character limits">
              <v-text-field label="Website" suffix=".com" model-value="orange" />
              <v-text-field label="Code" maxlength="12" counter="12" model-value="ABC-123" />
              <v-text-field label="Readonly" readonly model-value="Locked value" prepend-inner-icon="mdi-lock-outline" />
            </DemoSection>
          </div>
        </div>
      </v-window-item>

      <!-- InputNumber ------------------------------------------------------- -->
      <v-window-item value="input-number">
        <div class="tab-pane">
          <DemoSection title="基础用法 / Basic Usage" subtitle="Steppers and controlled values">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-number-input v-model="numberBasic" label="默认输入框 / Default" placeholder="输入数字..." />
                <div class="demo-note">当前值: {{ numberBasic ?? '—' }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <v-number-input v-model="numberStep" :step="5" label="带步长 / With Step" />
                <div class="demo-note">单次增减步长为 5</div>
              </v-col>
            </v-row>
          </DemoSection>

          <DemoSection title="按钮与精度 / Buttons & Precision" subtitle="Left controls, integer and price precision">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-number-input
                  v-model="numberFull"
                  :min="0"
                  :max="10"
                  :step="2"
                  reverse
                  control-variant="stacked"
                  label="完整交互 / Full Controls"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-number-input v-model="numberInt" :precision="0" control-variant="split" label="整数 / Integer" />
              </v-col>
              <v-col cols="12" md="4">
                <v-number-input
                  v-model="numberPrice"
                  :precision="2"
                  :step="0.01"
                  control-variant="split"
                  label="价格 / Price"
                />
              </v-col>
            </v-row>
          </DemoSection>

          <DemoSection title="表单验证示例 / Form Validation" subtitle="Live budget calculation">
            <v-form @submit.prevent="submitNumbers">
              <v-row dense>
                <v-col cols="12" md="3">
                  <v-number-input v-model="numberForm.age" :min="0" :max="150" label="年龄 / Age" control-variant="stacked" />
                </v-col>
                <v-col cols="12" md="3">
                  <v-number-input
                    v-model="numberForm.price"
                    :min="0"
                    :precision="2"
                    :step="0.01"
                    label="商品价格 / Price"
                    control-variant="stacked"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-number-input v-model="numberForm.quantity" :min="1" :max="1000" label="数量 / Quantity" reverse control-variant="stacked" />
                </v-col>
                <v-col cols="12" md="3">
                  <v-number-input v-model="numberForm.discount" :min="0" :max="100" label="折扣 / Discount %" control-variant="stacked" />
                </v-col>
              </v-row>
              <div class="budget-box">
                <span class="demo-note">实时预算 / Live budget:</span>
                <span class="budget-value mono">¥ {{ budget.toFixed(2) }}</span>
              </div>
              <div class="form-actions">
                <v-btn color="primary" type="submit" :loading="numberLoading">提交表单 / Submit Form</v-btn>
              </div>
            </v-form>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Mentions ---------------------------------------------------------- -->
      <v-window-item value="mentions">
        <div class="tab-pane">
          <DemoSection title="基础用法 / Basic Usage" subtitle="Type @ or click a user to mention">
            <v-textarea
              v-model="mentionText"
              label="输入评论并 @ 提及用户 / Enter comment and mention users"
              rows="4"
              auto-grow
              counter="500"
              placeholder="输入 @ 来提及用户... / Type @ to mention users..."
            />
            <div class="chip-row">
              <v-chip
                v-for="user in mentionUsers"
                :key="user.value"
                size="small"
                variant="tonal"
                prepend-icon="mdi-at"
                @click="insertMention(user.label)"
              >
                {{ user.label }}
              </v-chip>
            </div>
            <div v-if="mentionText" class="mention-preview">
              <div class="demo-note">当前内容 / Current Content:</div>
              <div class="mention-content">{{ mentionText }}</div>
            </div>
          </DemoSection>

          <div class="demo-grid demo-grid--2">
            <DemoSection title="已提及用户 / Mentioned users" subtitle="Unique chips collected from interactions">
              <div v-if="mentionedLabels.length" class="chip-row">
                <v-chip v-for="label in mentionedLabels" :key="label" size="small" color="primary" variant="tonal">
                  {{ label }}
                </v-chip>
              </div>
              <div v-else class="demo-note">暂未提及任何用户 / No users mentioned yet.</div>
              <v-btn variant="text" size="small" @click="mentionedLabels = []; mentionText = ''">Clear</v-btn>
            </DemoSection>

            <DemoSection title="加载 & 禁用 / Loading & Disabled" subtitle="Async user list and a locked field">
              <v-textarea
                label="加载用户后输入 / Load users first"
                rows="2"
                :loading="mentionLoading"
                :disabled="mentionLoading"
                placeholder="输入 @ 加载用户列表..."
              />
              <v-btn variant="tonal" :loading="mentionLoading" @click="loadMentionUsers">
                {{ mentionLoading ? '加载中... / Loading...' : '加载用户列表 / Load users' }}
              </v-btn>
              <v-textarea
                label="禁用的输入框 / Disabled"
                rows="2"
                disabled
                model-value="这是一个禁用的输入框 / This field is disabled"
              />
            </DemoSection>
          </div>
        </div>
      </v-window-item>

      <!-- Radio ------------------------------------------------------------- -->
      <v-window-item value="radio">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="基础用法 / Basic Usage" subtitle="Vertical group, single selection">
              <v-radio-group v-model="radioBasic" hide-details>
                <v-radio label="选项一 / Option One" value="option1" />
                <v-radio label="选项二 / Option Two" value="option2" />
                <v-radio label="选项三 / Option Three" value="option3" />
              </v-radio-group>
              <v-chip size="small" variant="tonal">Current: {{ radioBasic }}</v-chip>
            </DemoSection>

            <DemoSection title="横向布局 / Horizontal" subtitle="Inline payment method">
              <v-radio-group v-model="radioPayment" inline hide-details>
                <v-radio label="信用卡 / Credit Card" value="credit-card" />
                <v-radio label="支付宝 / Alipay" value="alipay" />
                <v-radio label="微信支付 / WeChat Pay" value="wechat" />
                <v-radio label="银行转账 / Bank Transfer" value="bank-transfer" />
              </v-radio-group>
              <div class="demo-note">Selected payment: {{ radioPayment }}</div>
              <v-divider class="my-2" />
              <v-radio-group v-model="radioNotification" hide-details>
                <v-radio label="接收所有通知 / Receive all notifications" value="all" />
                <v-radio label="仅接收重要通知 / Important only" value="important" />
                <v-radio label="不接收通知 / No notifications" value="none" />
              </v-radio-group>
            </DemoSection>
          </div>

          <DemoSection title="带描述的选项 / Options with Description" subtitle="Plan cards with prices">
            <v-radio-group v-model="radioPlan" hide-details>
              <div v-for="plan in radioPlans" :key="plan.value" class="plan-row">
                <v-radio :value="plan.value" :label="plan.title" hide-details />
                <div class="plan-meta">
                  <span class="demo-note">{{ plan.description }}</span>
                  <v-chip size="small" color="primary" variant="tonal">{{ plan.price }}</v-chip>
                </div>
              </div>
            </v-radio-group>
          </DemoSection>

          <DemoSection title="状态 / States" subtitle="Inline and disabled options">
            <v-radio-group v-model="radioState" inline hide-details>
              <v-radio label="启用 / Enabled" value="enabled" />
              <v-radio label="禁用 / Disabled" value="disabled" disabled />
            </v-radio-group>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Rate -------------------------------------------------------------- -->
      <v-window-item value="rate">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="基础用法 / Basic Usage" subtitle="Default, initial values and half stars">
              <div class="rating-row">
                <span class="rating-label">默认评分 / Default</span>
                <v-rating v-model="ratingDefault" color="warning" density="compact" />
              </div>
              <div class="rating-row">
                <span class="rating-label">初始评分 4 / Initial 4</span>
                <v-rating v-model="ratingFour" color="warning" density="compact" />
              </div>
              <div class="rating-row">
                <span class="rating-label">半星 2.5 / Half star</span>
                <v-rating v-model="ratingHalf" half-increments color="warning" density="compact" />
              </div>
              <div class="rating-row">
                <span class="rating-label">10 星 / 10 stars</span>
                <v-rating v-model="ratingTen" :length="10" size="x-small" color="primary" density="compact" />
              </div>
            </DemoSection>

            <DemoSection title="受控模式 / Controlled" subtitle="Clearable rating with live value">
              <div class="rating-row">
                <v-rating v-model="ratingControlled" clearable hover color="warning" />
                <v-chip size="small" variant="tonal">{{ ratingControlled }} / 5</v-chip>
              </div>
              <div class="form-actions">
                <v-btn variant="outlined" size="small" @click="ratingControlled = 0">清除评分 / Clear</v-btn>
              </div>
              <v-divider class="my-2" />
              <div class="rating-row">
                <span class="rating-label">爱心 / Heart</span>
                <v-rating v-model="ratingHeart" full-icon="mdi-heart" color="error" density="compact" />
              </div>
              <div class="rating-row">
                <span class="rating-label">禁用 / Disabled</span>
                <v-rating v-model="ratingDisabled" disabled color="warning" density="compact" />
              </div>
            </DemoSection>
          </div>

          <DemoSection title="表单验证示例 / Form Validation" subtitle="Rate service, quality and support">
            <v-form @submit.prevent="submitRating">
              <v-row dense>
                <v-col cols="12" md="4">
                  <div class="rating-label">您对服务的满意度 / Service Satisfaction</div>
                  <v-rating v-model="ratingSatisfaction" clearable hover color="warning" />
                  <div class="demo-note">{{ ratingSatisfaction }} / 5</div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="rating-label">商品质量 / Product Quality</div>
                  <v-rating v-model="ratingQuality" half-increments clearable hover color="success" />
                  <div class="demo-note">{{ ratingQuality }} / 5</div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="rating-label">客户服务 / Customer Service (0-10)</div>
                  <v-rating v-model="ratingService" :length="10" size="small" clearable hover color="info" />
                  <div class="demo-note">{{ ratingService }} / 10</div>
                </v-col>
              </v-row>
              <v-alert v-if="ratingSatisfaction || ratingQuality || ratingService" type="info" density="compact" variant="tonal">
                评分摘要 / Rating Summary — 满意度 {{ ratingSatisfaction }} / 5 · 质量 {{ ratingQuality }} / 5 · 服务 {{ ratingService }} / 10
              </v-alert>
              <div class="form-actions">
                <v-btn color="primary" type="submit" :loading="ratingLoading">提交评分 / Submit Rating</v-btn>
              </div>
            </v-form>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Select ------------------------------------------------------------ -->
      <v-window-item value="select">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="基础用法 / Basic Usage" subtitle="Country and language">
              <v-select v-model="selectCountry" :items="countries" label="选择国家 / Select country" />
              <v-select v-model="selectLanguage" :items="languages" label="选择语言 / Select language" />
            </DemoSection>

            <DemoSection title="受控模式 / Controlled" subtitle="Selected value is shown below">
              <v-select
                v-model="selectControlled"
                :items="countries"
                label="实时显示选择值 / Real-time selection"
                clearable
              />
              <div class="demo-note">
                已选择 / Selected:
                {{ countries.find((item) => item.value === selectControlled)?.title || '—' }}
              </div>
            </DemoSection>
          </div>

          <DemoSection title="分组与禁用 / Groups & Disabled" subtitle="Header items and disabled options">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-select v-model="selectCategory" :items="categoryItems" label="选择数据类型 / Data type" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="selectDepartment" :items="disabledDepartments" label="禁用的选项 / Disabled option" />
                <div class="demo-note">后端选项已禁用 / Backend is disabled</div>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  :items="countries"
                  label="禁用的选择器 / Disabled"
                  model-value="cn"
                  disabled
                />
              </v-col>
            </v-row>
          </DemoSection>

          <DemoSection title="长列表与多选 / Long list & Multiple" subtitle="Search-friendly city list and multi select">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectCity"
                  :items="[
                    { type: 'subheader', title: '华东 / East China' },
                    { title: '上海 / Shanghai', value: 'sh' },
                    { title: '杭州 / Hangzhou', value: 'hz' },
                    { title: '南京 / Nanjing', value: 'nj' },
                    { type: 'subheader', title: '华北 / North China' },
                    { title: '北京 / Beijing', value: 'bj' },
                    { title: '天津 / Tianjin', value: 'tj' },
                    { title: '郑州 / Zhengzhou', value: 'zz' },
                  ]"
                  label="选择城市 / Select city"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectMulti"
                  :items="departments"
                  label="多个部门 / Departments"
                  multiple
                  chips
                  closable-chips
                />
                <div class="demo-note">Selected departments: {{ selectMulti.join(', ') || '—' }}</div>
              </v-col>
            </v-row>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Slider ------------------------------------------------------------ -->
      <v-window-item value="slider">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="基础调节 / Basic controls" subtitle="Volume and brightness">
              <div class="slider-label">
                <v-icon size="18" :color="volume > 70 ? 'error' : 'primary'">mdi-volume-high</v-icon>
                <span>音量 / Volume ({{ volume }}%)</span>
              </div>
              <v-slider v-model="volume" :min="0" :max="100" :step="1" color="primary" thumb-label hide-details />
              <div class="slider-label">
                <v-icon size="18">mdi-brightness-6</v-icon>
                <span>亮度调节 / Brightness ({{ brightness }}%)</span>
              </div>
              <v-slider v-model="brightness" :min="0" :max="100" color="warning" thumb-label hide-details />
            </DemoSection>

            <DemoSection title="范围与温度 / Range & Temperature" subtitle="Range slider plus signed values">
              <div class="slider-label">
                <v-icon size="18">mdi-currency-usd</v-icon>
                <span>预算区间 / Budget: ${{ priceRange[0] }} - ${{ priceRange[1] }}</span>
              </div>
              <v-range-slider
                v-model="priceRange"
                :min="0"
                :max="500"
                :step="5"
                color="success"
                thumb-label
                hide-details
              />
              <div class="slider-label">
                <v-icon size="18">mdi-thermometer</v-icon>
                <span>环境温度 / Temperature ({{ temperature }}°C)</span>
              </div>
              <v-slider v-model="temperature" :min="-10" :max="50" :step="1" color="info" thumb-label hide-details />
            </DemoSection>
          </div>

          <DemoSection title="实时配置快照 / Snapshot" subtitle="Values update as sliders move">
            <pre class="code-block">{{ sliderSnapshot }}</pre>
            <div class="form-actions">
              <v-btn color="primary" :loading="sliderLoading" @click="saveSliders">保存当前设置 / Save</v-btn>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Switch ------------------------------------------------------------ -->
      <v-window-item value="switch">
        <div class="tab-pane">
          <DemoSection title="基础用法 / Basic Usage" subtitle="Binary settings with supporting text">
            <div class="switch-row">
              <div>
                <div class="switch-title">接收邮件订阅 / Newsletter</div>
                <div class="demo-note">开启后会收到每周订阅邮件</div>
              </div>
              <v-switch v-model="newsletter" color="primary" hide-details />
            </div>
            <div class="switch-row">
              <div>
                <div class="switch-title">桌面通知 / Desktop Notifications</div>
                <div class="demo-note">接收来自应用的桌面通知</div>
              </div>
              <v-switch v-model="notifications" color="primary" hide-details />
            </div>
          </DemoSection>

          <DemoSection title="受控模式 / Controlled" subtitle="Light and dark preview toggles stay in sync">
            <div class="switch-row">
              <div class="switch-inline">
                <v-icon color="warning">mdi-weather-sunny</v-icon>
                <div>
                  <div class="switch-title">浅色主题 / Light</div>
                  <div class="demo-note">切换以切换主题预览</div>
                </div>
              </div>
              <v-switch :model-value="!darkPreview" color="primary" hide-details @update:model-value="darkPreview = !$event" />
            </div>
            <div class="switch-row">
              <div class="switch-inline">
                <v-icon>mdi-weather-night</v-icon>
                <div>
                  <div class="switch-title">深色主题 / Dark</div>
                  <div class="demo-note">用于夜间模式</div>
                </div>
              </div>
              <v-switch v-model="darkPreview" color="primary" hide-details />
            </div>
          </DemoSection>

          <DemoSection title="表单集成 / Form Integration" subtitle="Terms must be accepted before saving">
            <v-form @submit.prevent="saveSwitches">
              <div class="switch-row">
                <div>
                  <div class="switch-title">同意条款 / Accept Terms</div>
                  <div class="demo-note">请阅读并同意服务条款</div>
                </div>
                <v-switch v-model="terms" color="primary" hide-details />
              </div>
              <v-alert v-if="!terms" type="warning" density="compact" variant="tonal">
                请同意条款后保存 / Please accept the terms before saving.
              </v-alert>
              <div class="form-actions">
                <v-btn color="primary" type="submit" :loading="switchLoading">保存设置 / Save Settings</v-btn>
              </div>
            </v-form>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- TimePicker -------------------------------------------------------- -->
      <v-window-item value="timepicker">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="基础用法 / Basic" subtitle="Native input and a clock picker">
              <v-text-field
                v-model="meetingTime"
                label="选择会议时间 / Meeting Time"
                type="time"
                prepend-inner-icon="mdi-clock-outline"
              />
              <div class="time-picker-wrap">
                <v-time-picker v-model="clockTime" format="24hr" class="time-picker" />
              </div>
              <div class="demo-note">当前选择: {{ clockTime || '未选择 / none' }}</div>
            </DemoSection>

            <div class="stack-col">
              <DemoSection title="范围/双端选择 / Range" subtitle="Office hours example">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="startTime" label="开始时间 / Start" type="time" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field v-model="endTime" label="结束时间 / End" type="time" />
                  </v-col>
                </v-row>
                <div class="demo-note">Shift: {{ startTime }} – {{ endTime }}</div>
              </DemoSection>

              <DemoSection title="秒级步进 / Seconds" subtitle="Time with seconds enabled">
                <v-text-field v-model="secondTime" label="带秒的时间 / Time with seconds" type="time" step="1" />
                <div class="demo-note">step=1 支持秒级选择</div>
              </DemoSection>

              <DemoSection title="禁用 / Disabled" subtitle="Read-only time value">
                <v-text-field label="不可用的时间选择器 / Disabled" type="time" model-value="12:00" disabled />
              </DemoSection>
            </div>
          </div>
        </div>
      </v-window-item>

      <!-- Transfer ---------------------------------------------------------- -->
      <v-window-item value="transfer">
        <div class="tab-pane">
          <DemoSection title="基础用法 / Basic" subtitle="Move items between two panels">
            <v-text-field
              v-model="transferSearch"
              label="搜索条目 / Search items"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
            />
            <div class="transfer-grid">
              <div class="transfer-panel">
                <div class="transfer-head">
                  <span>来源 / Source</span>
                  <v-chip size="x-small" variant="tonal">{{ filteredAvailable.length }}</v-chip>
                </div>
                <v-list density="compact" class="transfer-list">
                  <v-list-item v-for="item in filteredAvailable" :key="item.key" :disabled="item.disabled">
                    <template #prepend>
                      <v-checkbox-btn v-model="sourceSelected" :value="item.key" :disabled="item.disabled" />
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                  </v-list-item>
                  <div v-if="!filteredAvailable.length" class="transfer-empty">No items</div>
                </v-list>
              </div>

              <div class="transfer-actions">
                <v-btn
                  icon="mdi-chevron-right"
                  size="small"
                  color="primary"
                  :disabled="!sourceSelected.length"
                  aria-label="Move to target"
                  @click="moveToTarget"
                />
                <v-btn
                  icon="mdi-chevron-left"
                  size="small"
                  :disabled="!targetSelected.length"
                  aria-label="Move to source"
                  @click="moveToSource"
                />
              </div>

              <div class="transfer-panel">
                <div class="transfer-head">
                  <span>目标 / Target</span>
                  <v-chip size="x-small" variant="tonal">{{ filteredTarget.length }}</v-chip>
                </div>
                <v-list density="compact" class="transfer-list">
                  <v-list-item v-for="item in filteredTarget" :key="item.key" :disabled="item.disabled">
                    <template #prepend>
                      <v-checkbox-btn v-model="targetSelected" :value="item.key" :disabled="item.disabled" />
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                  </v-list-item>
                  <div v-if="!filteredTarget.length" class="transfer-empty">No items</div>
                </v-list>
              </div>
            </div>
            <div class="demo-note">
              Disabled items are skipped (Item 1, Item 8). Target keys: {{ targetKeys.join(', ') || '—' }}
            </div>
          </DemoSection>

          <DemoSection title="表单集成 / Form Integration" subtitle="Persist the selected keys">
            <div class="chip-row">
              <v-chip v-for="key in targetKeys" :key="key" size="small" color="primary" variant="tonal">
                {{ transferItems.find((item) => item.key === key)?.title }}
              </v-chip>
            </div>
            <div class="form-actions">
              <v-btn color="primary" :loading="transferSaving" @click="saveTransfer">保存 / Save</v-btn>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- TreeSelect -------------------------------------------------------- -->
      <v-window-item value="treeselect">
        <div class="tab-pane">
          <div class="demo-grid demo-grid--2">
            <DemoSection title="基础用法 / Basic Usage" subtitle="Nested selects plus a tree list">
              <v-select v-model="treeRegion" :items="treeRegionOptions" label="大洲 / Region" hide-details />
              <v-select v-model="treeCountry" :items="treeCountryOptions" label="国家 / Country" hide-details />
              <v-chip size="small" variant="tonal">
                Path: {{ findPath(treeData, treeCountry)?.join(' > ') || '—' }}
              </v-chip>
              <v-list density="compact" class="tree-list">
                <template v-for="node in treeData" :key="node.value">
                  <v-list-item :title="node.title" prepend-icon="mdi-earth" />
                  <template v-for="child in node.children" :key="child.value">
                    <v-list-item class="tree-child" :title="child.title" prepend-icon="mdi-map-marker-outline" />
                    <v-list-item
                      v-for="leaf in child.children"
                      :key="leaf.value"
                      class="tree-leaf"
                      :title="leaf.title"
                      prepend-icon="mdi-map-marker"
                    />
                  </template>
                </template>
              </v-list>
            </DemoSection>

            <div class="stack-col">
              <DemoSection title="受控多选 / Controlled Multiple" subtitle="Tags, select all and clear">
                <v-select
                  v-model="treeSelected"
                  :items="treeData.flatMap((node) =>
                    (node.children ?? []).flatMap((child) =>
                      child.children
                        ? child.children.map((leaf) => ({ title: `${child.title} / ${leaf.title}`, value: leaf.value }))
                        : [{ title: child.title, value: child.value }],
                    ),
                  )"
                  label="已选国家 / Selected countries"
                  multiple
                  chips
                  closable-chips
                  hide-details
                />
                <div class="chip-row">
                  <v-btn size="small" variant="tonal" @click="selectAllTree">全选 / Select All</v-btn>
                  <v-btn size="small" variant="outlined" @click="treeSelected = []">清空 / Clear</v-btn>
                </div>
                <div v-if="treeSelectedPaths.length" class="path-list">
                  <div v-for="entry in treeSelectedPaths" :key="entry.path" class="demo-note">
                    {{ entry.path }}
                  </div>
                </div>
                <pre class="code-block">{{ JSON.stringify(treeSelected) }}</pre>
              </DemoSection>

              <DemoSection title="异步加载 / Async Load" subtitle="Success and failure states">
                <div class="chip-row">
                  <v-btn size="small" variant="tonal" :loading="treeLoading" @click="loadRemoteTree(false)">重新加载 / Reload</v-btn>
                  <v-btn size="small" variant="outlined" :disabled="treeLoading" @click="loadRemoteTree(true)">模拟失败 / Fail</v-btn>
                </div>
                <v-progress-linear v-if="treeLoading" indeterminate color="primary" rounded />
                <v-alert v-if="treeError" type="error" density="compact" variant="tonal">{{ treeError }}</v-alert>
                <v-select
                  v-if="remoteTree"
                  :items="treeData.map((node) => ({ title: node.title, value: node.value }))"
                  label="远程数据 / Remote data"
                  hide-details
                />
                <div v-if="!treeLoading && !remoteTree && !treeError" class="demo-note">
                  Press reload to load the remote tree.
                </div>
              </DemoSection>
            </div>
          </div>

          <DemoSection title="禁用状态 / Disabled" subtitle="Tree selector cannot be changed">
            <v-select
              :items="treeRegionOptions"
              label="此选择器已禁用 / This selector is disabled"
              model-value="asia"
              disabled
            />
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Upload ------------------------------------------------------------ -->
      <v-window-item value="upload">
        <div class="tab-pane">
          <DemoSection title="方式 1: 标准上传 / Option 1: Standard" subtitle="Pick files and review the list">
            <v-file-input
              v-model="uploadFiles"
              label="普通文件 / Files"
              multiple
              show-size
              chips
              prepend-icon="mdi-paperclip"
              accept=".pdf,.png,.jpg,.txt,.zip"
            />
            <div v-if="uploadFiles.length" class="file-list">
              <div v-for="(file, index) in uploadFiles" :key="`${file.name}-${index}`" class="file-row">
                <v-icon size="18">mdi-file-outline</v-icon>
                <span class="file-name">{{ file.name }}</span>
                <span class="demo-note">{{ (file.size / 1024).toFixed(0) }} KB</span>
                <v-btn icon="mdi-close" size="x-small" variant="text" aria-label="Remove file" @click="removeFile(index)" />
              </div>
            </div>
            <div v-else class="demo-note">No files selected yet.</div>
            <div class="demo-note">Total: {{ uploadTotalKb }} KB</div>
          </DemoSection>

          <DemoSection title="方式 2: 大文件续传 / Option 2: Resumable" subtitle="Simulated chunked upload with progress">
            <v-file-input
              v-model="uploadFiles"
              label="选择大文件 / Select Large Files"
              multiple
              show-size
              prepend-icon="mdi-harddisk"
            />
            <v-progress-linear :model-value="uploadProgress" height="8" rounded color="primary" />
            <div class="demo-note">
              {{ uploading ? `正在上传 / Uploading… ${uploadProgress}%` : uploadProgress === 100 ? '上传完成 / Complete' : '等待开始 / Ready' }}
            </div>
            <div class="chip-row">
              <v-btn color="primary" size="small" :disabled="!uploadFiles.length || uploading" :loading="uploading" @click="startUpload">
                开始上传 / Start
              </v-btn>
              <v-btn variant="outlined" size="small" :disabled="!uploading" @click="cancelUpload">取消 / Cancel</v-btn>
            </div>
          </DemoSection>

          <DemoSection title="上传限制 / Constraints" subtitle="Accepted types and size guidance">
            <div class="chip-row">
              <v-chip size="small" variant="tonal">Accept: .pdf .png .jpg .txt .zip</v-chip>
              <v-chip size="small" variant="tonal">Max: 5 MB per chunk</v-chip>
              <v-chip size="small" variant="tonal">Chunk: 5 MB</v-chip>
            </div>
            <v-alert type="info" density="compact" variant="tonal">
              大文件使用分片续传，普通文件可直接选择后上传 / Large files use resumable chunks.
            </v-alert>
          </DemoSection>
        </div>
      </v-window-item>
    </v-window>
  </div>
</template>

<style scoped>
.demo-tabs--scroll {
  width: 100%;
  height: auto;
  min-height: 32px;
}

.demo-tabs--scroll :deep(.v-slide-group) {
  height: auto;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.demo-tabs--scroll :deep(.v-slide-group__content) {
  flex-wrap: nowrap;
}

.demo-tabs--scroll :deep(.v-tab) {
  flex: 0 0 auto;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.demo-note {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.code-block {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
}

/* Cascader / TreeSelect */
.tree-list {
  background: transparent;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 10px;
}

.tree-child {
  padding-inline-start: 28px;
}

.tree-leaf {
  padding-inline-start: 48px;
  opacity: 0.85;
}

.purple-select :deep(.v-field) {
  border-color: #8b5cf6;
  border-width: 2px;
}

.purple-select :deep(.v-field--focused) {
  border-color: #7c3aed;
}

/* ColorPicker */
.color-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.native-color {
  width: 56px;
  height: 40px;
  padding: 2px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.swatch-large {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  border-radius: 10px;
  border: 1px solid rgb(var(--v-border-color));
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
  transition: background-color 0.3s ease;
}

.swatch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.swatch {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.swatch:hover {
  transform: translateY(-2px);
}

.swatch--active {
  border-color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 0 0 2px rgb(var(--v-theme-surface));
}

.gradient-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  border-radius: 10px;
  border: 1px solid rgb(var(--v-border-color));
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.35);
}

.date-picker,
.time-picker {
  max-width: 100%;
}

.time-picker-wrap {
  max-width: 100%;
  overflow-x: auto;
}

/* InputNumber */
.budget-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px dashed rgb(var(--v-border-color));
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
}

.budget-value {
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

/* Mentions */
.mention-preview {
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-variant));
}

.mention-content {
  margin-top: 4px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Radio */
.plan-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 10px;
}

.plan-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-left: 40px;
}

/* Rate */
.rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.rating-label {
  font-size: 13px;
  font-weight: 600;
}

/* Slider */
.slider-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

/* Switch */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}

.switch-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-title {
  font-size: 13px;
  font-weight: 600;
}

/* Transfer */
.transfer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.transfer-panel {
  min-width: 0;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 10px;
  overflow: hidden;
}

.transfer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: rgb(var(--v-theme-surface-variant));
  font-size: 12px;
  font-weight: 600;
}

.transfer-list {
  max-height: 280px;
  overflow-y: auto;
  background: transparent;
}

.transfer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transfer-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* TreeSelect */
.path-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Upload */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed rgb(var(--v-border-color));
}

.file-row:last-child {
  border-bottom: 0;
}

.file-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .transfer-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .transfer-actions {
    flex-direction: row;
    justify-content: center;
  }

  .plan-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
