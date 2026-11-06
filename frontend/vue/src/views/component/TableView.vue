<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import DemoSection from '@/components/demo/DemoSection.vue'

const ui = useUiStore()

const tab = ref('basic')

type PersonStatus = 'single' | 'relationship' | 'complicated'
type Person = {
  id: number
  firstName: string
  lastName: string
  age: number
  visits: number
  status: PersonStatus
  progress: number
}
type ColumnKey = keyof Person
type ScoredPerson = Person & { score: number }

const people: Person[] = [
  { id: 1, firstName: 'Tanner', lastName: 'Linsley', age: 24, visits: 100, status: 'relationship', progress: 50 },
  { id: 2, firstName: 'Jason', lastName: 'Maurer', age: 32, visits: 40, status: 'single', progress: 80 },
  { id: 3, firstName: 'Jesse', lastName: 'Chambers', age: 45, visits: 80, status: 'complicated', progress: 20 },
  { id: 4, firstName: 'Alice', lastName: 'Smith', age: 28, visits: 55, status: 'single', progress: 65 },
  { id: 5, firstName: 'Bob', lastName: 'Martin', age: 36, visits: 123, status: 'relationship', progress: 50 },
  { id: 6, firstName: 'Carol', lastName: 'White', age: 31, visits: 210, status: 'complicated', progress: 35 },
  { id: 7, firstName: 'Tandy', lastName: 'Miller', age: 40, visits: 40, status: 'single', progress: 80 },
  { id: 8, firstName: 'Joe', lastName: 'Dirte', age: 45, visits: 20, status: 'complicated', progress: 10 },
]

const statusColor = (status: PersonStatus) =>
  status === 'single' ? 'info' : status === 'relationship' ? 'success' : 'warning'
const statusLabel = (status: PersonStatus) => status.charAt(0).toUpperCase() + status.slice(1)

/* Basic ------------------------------------------------------------------- */
const basicSearch = ref('')
const selectedBasic = ref<number[]>([])
const basicHeaders = [
  { title: 'First Name', key: 'firstName' },
  { title: 'Last Name', key: 'lastName' },
  { title: 'Age', key: 'age' },
  { title: 'Visits', key: 'visits' },
  { title: 'Status', key: 'status' },
  { title: 'Progress', key: 'progress' },
]
const compactRows = people.slice(0, 4)

/* Header groups ----------------------------------------------------------- */
const denseGrouped = ref(true)
const groupedRows = people.slice(0, 5)

/* Filters ----------------------------------------------------------------- */
const filters = reactive({ firstName: '', lastName: '', age: '', status: '' })
const activeFilterCount = computed(
  () => Object.values(filters).filter((value) => value.trim() !== '').length,
)
const filteredPeople = computed(() => {
  const firstName = filters.firstName.trim().toLowerCase()
  const lastName = filters.lastName.trim().toLowerCase()
  const age = filters.age.trim()
  const status = filters.status.trim().toLowerCase()
  return people.filter(
    (person) =>
      (!firstName || person.firstName.toLowerCase().includes(firstName)) &&
      (!lastName || person.lastName.toLowerCase().includes(lastName)) &&
      (!age || String(person.age).includes(age)) &&
      (!status || person.status.toLowerCase().includes(status)),
  )
})
function clearFilters() {
  filters.firstName = ''
  filters.lastName = ''
  filters.age = ''
  filters.status = ''
}

/* Faceted filters --------------------------------------------------------- */
const statusFacets: PersonStatus[] = ['single', 'relationship', 'complicated']
const selectedStatuses = ref<PersonStatus[]>([])
const statusCounts = computed(
  () =>
    Object.fromEntries(
      statusFacets.map((status) => [status, people.filter((person) => person.status === status).length]),
    ) as Record<PersonStatus, number>,
)
const facetedRows = computed(() =>
  selectedStatuses.value.length
    ? people.filter((person) => selectedStatuses.value.includes(person.status))
    : people,
)
function toggleStatus(status: PersonStatus) {
  selectedStatuses.value = selectedStatuses.value.includes(status)
    ? selectedStatuses.value.filter((item) => item !== status)
    : [...selectedStatuses.value, status]
}

/* Fuzzy filters ----------------------------------------------------------- */
const globalFilter = ref('')
const fuzzyNameFilter = ref('')
const fuzzySortKey = ref<ColumnKey>('firstName')
const fuzzySortAsc = ref(true)
const fuzzyPage = ref(1)
const fuzzyPageSize = ref(5)
const fuzzySeed = ref(1)

const fuzzyData = computed<Person[]>(() =>
  people.map((person, index) => ({
    ...person,
    visits: (person.visits * fuzzySeed.value + index * 7) % 1000,
    progress: (person.progress + index * 13 * fuzzySeed.value) % 101,
  })),
)

function fuzzyScore(person: Person, query: string): number {
  const term = query.trim().toLowerCase()
  if (!term) return 0
  const haystack = `${person.id} ${person.firstName} ${person.lastName} ${person.status}`.toLowerCase()
  let score = 0
  for (const part of term.split(/\s+/).filter(Boolean)) {
    const index = haystack.indexOf(part)
    if (index < 0) return -1
    score += index
  }
  return score
}

const fuzzyRows = computed<ScoredPerson[]>(() => {
  const scored = fuzzyData.value
    .map((person) => ({ ...person, score: fuzzyScore(person, globalFilter.value) }))
    .filter((person) => person.score >= 0)
    .filter((person) => {
      const term = fuzzyNameFilter.value.trim().toLowerCase()
      return !term || `${person.firstName} ${person.lastName}`.toLowerCase().includes(term)
    })
  const key = fuzzySortKey.value
  return scored.sort((left, right) => {
    if (globalFilter.value.trim() && left.score !== right.score) return left.score - right.score
    const a = left[key]
    const b = right[key]
    const result =
      typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b))
    return fuzzySortAsc.value ? result : -result
  })
})

const fuzzyPageCount = computed(() =>
  Math.max(1, Math.ceil(fuzzyRows.value.length / fuzzyPageSize.value)),
)
const pagedFuzzyRows = computed(() => {
  const start = (fuzzyPage.value - 1) * fuzzyPageSize.value
  return fuzzyRows.value.slice(start, start + fuzzyPageSize.value)
})
function toggleFuzzySort(key: ColumnKey) {
  if (fuzzySortKey.value === key) {
    fuzzySortAsc.value = !fuzzySortAsc.value
  } else {
    fuzzySortKey.value = key
    fuzzySortAsc.value = true
  }
  fuzzyPage.value = 1
}
function sortIcon(key: ColumnKey) {
  if (fuzzySortKey.value !== key) return 'mdi-unfold-more-horizontal'
  return fuzzySortAsc.value ? 'mdi-arrow-up' : 'mdi-arrow-down'
}
function refreshFuzzyData() {
  fuzzySeed.value += 1
  ui.notify('Data refreshed / 数据已刷新', 'success')
}
watch([globalFilter, fuzzyNameFilter, fuzzyPageSize], () => {
  fuzzyPage.value = 1
})
watch(fuzzyPageCount, (count) => {
  if (fuzzyPage.value > count) fuzzyPage.value = count
})

/* Column ordering --------------------------------------------------------- */
const columnDefs: { key: ColumnKey; title: string }[] = [
  { key: 'id', title: 'ID' },
  { key: 'firstName', title: 'First Name' },
  { key: 'lastName', title: 'Last Name' },
  { key: 'age', title: 'Age' },
  { key: 'visits', title: 'Visits' },
  { key: 'status', title: 'Status' },
  { key: 'progress', title: 'Profile Progress' },
]
const columnVisibility = reactive<Record<ColumnKey, boolean>>({
  id: true,
  firstName: true,
  lastName: true,
  age: true,
  visits: true,
  status: true,
  progress: true,
})
const allVisible = computed({
  get: () => columnDefs.every((column) => columnVisibility[column.key]),
  set: (value: boolean) => {
    for (const column of columnDefs) columnVisibility[column.key] = value
  },
})
const columnOrder = ref<ColumnKey[]>(columnDefs.map((column) => column.key))
const orderedVisibleColumns = computed(() =>
  columnOrder.value
    .filter((key) => columnVisibility[key])
    .map((key) => columnDefs.find((column) => column.key === key))
    .filter((column): column is { key: ColumnKey; title: string } => Boolean(column)),
)
const orderingSeed = ref(1)
const orderingData = computed<Person[]>(() =>
  people.map((person, index) => ({
    ...person,
    visits: (person.visits + orderingSeed.value * 17 + index * 9) % 1000,
    progress: (person.progress + index * 5) % 101,
  })),
)
function shuffleColumns() {
  columnOrder.value = [...columnOrder.value].sort(() => Math.random() - 0.5)
}
function regenerateOrderingData() {
  orderingSeed.value += 1
  ui.notify('Rows regenerated / 数据已重新生成', 'success')
}

/* Column DnD (keyboard / button reorder) ---------------------------------- */
const dndOrder = ref<ColumnKey[]>(columnDefs.map((column) => column.key))
const dndColumns = computed(() =>
  dndOrder.value
    .map((key) => columnDefs.find((column) => column.key === key))
    .filter((column): column is { key: ColumnKey; title: string } => Boolean(column)),
)
const dndSeed = ref(1)
const dndRows = computed<Person[]>(() =>
  people.map((person, index) => ({
    ...person,
    visits: (person.visits + dndSeed.value * 11 + index * 3) % 1000,
    progress: (person.progress + index * 7) % 101,
  })),
)
function moveColumn(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= dndOrder.value.length) return
  const next = [...dndOrder.value]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  dndOrder.value = next
}
function resetDndOrder() {
  dndOrder.value = columnDefs.map((column) => column.key)
}
function regenerateDndData() {
  dndSeed.value += 1
  ui.notify('Rows regenerated / 数据已重新生成', 'success')
}
</script>

<template>
  <div class="demo-page">

    <v-tabs v-model="tab" class="demo-tabs demo-tabs--scroll">
      <v-tab value="basic">Basic</v-tab>
      <v-tab value="header-groups">Header Groups</v-tab>
      <v-tab value="filters">Filters</v-tab>
      <v-tab value="filters-faceted">Faceted Filters</v-tab>
      <v-tab value="filters-fuzzy">Fuzzy Filters</v-tab>
      <v-tab value="column-ordering">Column Ordering</v-tab>
      <v-tab value="column-dnd">Column DnD</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <!-- Basic ------------------------------------------------------------ -->
      <v-window-item value="basic">
        <div class="tab-pane">
          <DemoSection title="Basic Table" subtitle="v-data-table with selection, search and custom cells">
            <template #actions>
              <v-chip v-if="selectedBasic.length" size="small" color="primary" variant="tonal">
                {{ selectedBasic.length }} selected
              </v-chip>
            </template>
            <div class="table-toolbar">
              <v-text-field
                v-model="basicSearch"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                style="max-width: 280px"
              />
              <v-spacer />
              <v-btn variant="outlined" size="small" @click="selectedBasic = []">Clear selection</v-btn>
            </div>
            <v-data-table
              v-model="selectedBasic"
              :headers="basicHeaders"
              :items="people"
              :search="basicSearch"
              item-value="id"
              show-select
              :items-per-page="5"
              density="comfortable"
              class="data-table"
            >
              <template #item.status="{ item }">
                <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                  {{ statusLabel(item.status) }}
                </v-chip>
              </template>
              <template #item.progress="{ item }">
                <div class="progress-cell">
                  <v-progress-linear :model-value="item.progress" height="6" rounded color="primary" />
                  <span class="progress-value">{{ item.progress }}%</span>
                </div>
              </template>
            </v-data-table>
          </DemoSection>

          <DemoSection title="Compact Table" subtitle="Dense v-table with custom status icons">
            <v-table density="compact" class="compact-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Visits</th>
                  <th class="text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in compactRows" :key="row.id">
                  <td><code class="mono">#{{ row.id }}</code></td>
                  <td>{{ row.firstName }} {{ row.lastName }}</td>
                  <td>{{ row.age }}</td>
                  <td>{{ row.visits }}</td>
                  <td class="text-end">
                    <v-icon :color="statusColor(row.status)" size="18">
                      {{ row.status === 'complicated' ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline' }}
                    </v-icon>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Header Groups ---------------------------------------------------- -->
      <v-window-item value="header-groups">
        <div class="tab-pane">
          <DemoSection title="Column Groups with Sticky Header" subtitle="Three header levels: Name, Info and More">
            <template #actions>
              <v-switch v-model="denseGrouped" label="Dense rows" color="primary" density="compact" hide-details />
            </template>
            <div class="table-scroll">
              <table class="grouped-table" :class="{ 'grouped-table--dense': denseGrouped }">
                <thead>
                  <tr>
                    <th colspan="2">Name</th>
                    <th colspan="4">Info</th>
                  </tr>
                  <tr>
                    <th rowspan="2">First Name</th>
                    <th rowspan="2">Last Name</th>
                    <th rowspan="2">Age</th>
                    <th colspan="3">More</th>
                  </tr>
                  <tr>
                    <th>Visits</th>
                    <th>Status</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in groupedRows" :key="row.id">
                    <td>{{ row.firstName }}</td>
                    <td>{{ row.lastName }}</td>
                    <td>{{ row.age }}</td>
                    <td>{{ row.visits }}</td>
                    <td>
                      <v-chip size="x-small" :color="statusColor(row.status)" variant="tonal">
                        {{ statusLabel(row.status) }}
                      </v-chip>
                    </td>
                    <td>{{ row.progress }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DemoSection>

          <DemoSection title="Sticky Behaviour" subtitle="The header stays visible while the body scrolls">
            <div class="demo-note">
              Scroll the table above — all three header rows remain pinned to the top. Toggle “Dense rows” to
              compare the row height.
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Filters ---------------------------------------------------------- -->
      <v-window-item value="filters">
        <div class="tab-pane">
          <DemoSection title="Column Filters" subtitle="Filter each column independently">
            <template #actions>
              <v-chip size="small" variant="tonal">{{ filteredPeople.length }} rows</v-chip>
            </template>
            <div class="filter-bar">
              <v-text-field v-model="filters.firstName" label="First Name" density="compact" hide-details clearable />
              <v-text-field v-model="filters.lastName" label="Last Name" density="compact" hide-details clearable />
              <v-text-field v-model="filters.age" label="Age" density="compact" hide-details clearable />
              <v-text-field v-model="filters.status" label="Status" density="compact" hide-details clearable />
            </div>
            <div class="table-toolbar">
              <v-chip size="small" variant="tonal">Active filters: {{ activeFilterCount }}</v-chip>
              <v-spacer />
              <v-btn variant="text" size="small" :disabled="!activeFilterCount" @click="clearFilters">
                Clear filters
              </v-btn>
            </div>
            <v-table density="compact" class="compact-table">
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Visits</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredPeople" :key="row.id">
                  <td>{{ row.firstName }}</td>
                  <td>{{ row.lastName }}</td>
                  <td>{{ row.age }}</td>
                  <td>{{ statusLabel(row.status) }}</td>
                  <td>{{ row.visits }}</td>
                  <td>{{ row.progress }}%</td>
                </tr>
                <tr v-if="!filteredPeople.length">
                  <td colspan="6" class="empty-cell">No results.</td>
                </tr>
              </tbody>
            </v-table>
          </DemoSection>

          <DemoSection title="Filter State" subtitle="Chips reflect the current filter values">
            <div class="chip-row">
              <v-chip
                v-for="(value, key) in filters"
                v-show="value"
                :key="key"
                size="small"
                color="primary"
                variant="tonal"
              >
                {{ key }}: {{ value }}
              </v-chip>
              <span v-if="!activeFilterCount" class="demo-note">No active filters.</span>
            </div>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Faceted Filters -------------------------------------------------- -->
      <v-window-item value="filters-faceted">
        <div class="tab-pane">
          <DemoSection title="Faceted Filters" subtitle="Status facets with live counts">
            <template #actions>
              <v-chip size="small" variant="tonal">{{ facetedRows.length }} rows</v-chip>
            </template>
            <div class="chip-row">
              <v-chip
                v-for="status in statusFacets"
                :key="status"
                :color="selectedStatuses.includes(status) ? statusColor(status) : undefined"
                :variant="selectedStatuses.includes(status) ? 'flat' : 'tonal'"
                @click="toggleStatus(status)"
              >
                {{ statusLabel(status) }} ({{ statusCounts[status] }})
              </v-chip>
              <v-btn variant="text" size="small" :disabled="!selectedStatuses.length" @click="selectedStatuses = []">
                Clear
              </v-btn>
            </div>
            <v-table density="compact" class="compact-table">
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Age</th>
                  <th>Visits</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in facetedRows" :key="row.id">
                  <td>{{ row.firstName }}</td>
                  <td>{{ row.lastName }}</td>
                  <td>{{ row.age }}</td>
                  <td>{{ row.visits }}</td>
                  <td>
                    <v-chip size="x-small" :color="statusColor(row.status)" variant="tonal">
                      {{ statusLabel(row.status) }}
                    </v-chip>
                  </td>
                  <td>{{ row.progress }}%</td>
                </tr>
                <tr v-if="!facetedRows.length">
                  <td colspan="6" class="empty-cell">No results.</td>
                </tr>
              </tbody>
            </v-table>
          </DemoSection>

          <DemoSection title="Selected Facets" subtitle="Combined with the status facet counts">
            <div class="chip-row">
              <v-chip v-for="status in selectedStatuses" :key="status" size="small" :color="statusColor(status)" variant="tonal">
                {{ statusLabel(status) }}
              </v-chip>
              <span v-if="!selectedStatuses.length" class="demo-note">All statuses are shown.</span>
            </div>
            <pre class="code-block">{{ JSON.stringify(selectedStatuses) }}</pre>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Fuzzy Filters ---------------------------------------------------- -->
      <v-window-item value="filters-fuzzy">
        <div class="tab-pane">
          <DemoSection title="Global Fuzzy Search" subtitle="Ranked matches across all columns">
            <template #actions>
              <v-chip size="small" variant="tonal">{{ fuzzyRows.length }} matches</v-chip>
            </template>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="globalFilter"
                  label="Search all columns..."
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  hide-details
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="fuzzyNameFilter"
                  label="Full name filter (includes)"
                  density="compact"
                  hide-details
                  clearable
                />
              </v-col>
            </v-row>
            <v-table density="compact" class="compact-table">
              <thead>
                <tr>
                  <th v-for="column in columnDefs.slice(0, 6)" :key="column.key">
                    <button type="button" class="sort-btn" @click="toggleFuzzySort(column.key)">
                      {{ column.title }}
                      <v-icon size="14">{{ sortIcon(column.key) }}</v-icon>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in pagedFuzzyRows" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.firstName }}</td>
                  <td>{{ row.lastName }}</td>
                  <td>{{ row.age }}</td>
                  <td>{{ row.visits }}</td>
                  <td>
                    <v-chip size="x-small" :color="statusColor(row.status)" variant="tonal">
                      {{ statusLabel(row.status) }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="!pagedFuzzyRows.length">
                  <td colspan="6" class="empty-cell">No results.</td>
                </tr>
              </tbody>
            </v-table>
          </DemoSection>

          <DemoSection title="Pagination & Data" subtitle="Page size, navigation and refresh">
            <div class="pagination-bar">
              <v-btn
                size="small"
                variant="outlined"
                icon="mdi-page-first"
                :disabled="fuzzyPage <= 1"
                aria-label="First page"
                @click="fuzzyPage = 1"
              />
              <v-btn
                size="small"
                variant="outlined"
                icon="mdi-chevron-left"
                :disabled="fuzzyPage <= 1"
                aria-label="Previous page"
                @click="fuzzyPage -= 1"
              />
              <span class="demo-note">Page {{ fuzzyPage }} of {{ fuzzyPageCount }}</span>
              <v-btn
                size="small"
                variant="outlined"
                icon="mdi-chevron-right"
                :disabled="fuzzyPage >= fuzzyPageCount"
                aria-label="Next page"
                @click="fuzzyPage += 1"
              />
              <v-btn
                size="small"
                variant="outlined"
                icon="mdi-page-last"
                :disabled="fuzzyPage >= fuzzyPageCount"
                aria-label="Last page"
                @click="fuzzyPage = fuzzyPageCount"
              />
              <v-select
                v-model="fuzzyPageSize"
                :items="[5, 10, 20]"
                label="Rows"
                density="compact"
                hide-details
                style="max-width: 100px"
              />
              <v-spacer />
              <v-btn variant="outlined" size="small" prepend-icon="mdi-refresh" @click="refreshFuzzyData">
                Refresh Data
              </v-btn>
            </div>
            <pre class="code-block">{{
              JSON.stringify(
                {
                  globalFilter,
                  fuzzyNameFilter,
                  page: fuzzyPage,
                  pageSize: fuzzyPageSize,
                  rows: fuzzyRows.length,
                },
                null,
                2,
              )
            }}</pre>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Column Ordering -------------------------------------------------- -->
      <v-window-item value="column-ordering">
        <div class="tab-pane">
          <DemoSection title="Column Visibility & Order" subtitle="Toggle columns and shuffle their order">
            <div class="column-panel">
              <v-checkbox v-model="allVisible" label="Toggle All" density="compact" hide-details />
              <v-divider class="my-2" />
              <v-checkbox
                v-for="column in columnDefs"
                :key="column.key"
                v-model="columnVisibility[column.key]"
                :label="column.title"
                density="compact"
                hide-details
              />
            </div>
            <div class="chip-row">
              <v-btn variant="outlined" size="small" prepend-icon="mdi-refresh" @click="regenerateOrderingData">
                Regenerate
              </v-btn>
              <v-btn variant="outlined" size="small" prepend-icon="mdi-shuffle-variant" @click="shuffleColumns">
                Shuffle Columns
              </v-btn>
              <v-btn variant="text" size="small" @click="columnOrder = columnDefs.map((column) => column.key)">
                Reset Order
              </v-btn>
            </div>
            <div class="table-scroll">
              <table class="grouped-table grouped-table--dense">
                <thead>
                  <tr>
                    <th v-for="column in orderedVisibleColumns" :key="column.key">{{ column.title }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in orderingData" :key="row.id">
                    <td v-for="column in orderedVisibleColumns" :key="column.key">
                      <v-chip v-if="column.key === 'status'" size="x-small" :color="statusColor(row.status)" variant="tonal">
                        {{ statusLabel(row.status) }}
                      </v-chip>
                      <span v-else-if="column.key === 'progress'">{{ row.progress }}%</span>
                      <span v-else>{{ row[column.key] }}</span>
                    </td>
                  </tr>
                  <tr v-if="!orderedVisibleColumns.length">
                    <td class="empty-cell">All columns are hidden.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DemoSection>

          <DemoSection title="Column State" subtitle="Order and visibility are kept in sync">
            <pre class="code-block">{{
              JSON.stringify(
                {
                  order: columnOrder,
                  visible: columnDefs.filter((column) => columnVisibility[column.key]).map((column) => column.key),
                },
                null,
                2,
              )
            }}</pre>
          </DemoSection>
        </div>
      </v-window-item>

      <!-- Column DnD ------------------------------------------------------- -->
      <v-window-item value="column-dnd">
        <div class="tab-pane">
          <DemoSection title="Reorder Columns" subtitle="Up/down buttons replace drag handles">
            <template #actions>
              <v-chip size="small" variant="tonal">{{ dndRows.length }} rows</v-chip>
            </template>
            <div class="dnd-list">
              <div v-for="(column, index) in dndColumns" :key="column.key" class="dnd-row">
                <v-icon size="18">mdi-drag-horizontal-variant</v-icon>
                <span class="dnd-title">{{ column.title }}</span>
                <v-spacer />
                <v-btn
                  icon="mdi-arrow-up"
                  size="x-small"
                  variant="text"
                  :disabled="index === 0"
                  :aria-label="`Move ${column.title} up`"
                  @click="moveColumn(index, -1)"
                />
                <v-btn
                  icon="mdi-arrow-down"
                  size="x-small"
                  variant="text"
                  :disabled="index === dndColumns.length - 1"
                  :aria-label="`Move ${column.title} down`"
                  @click="moveColumn(index, 1)"
                />
              </div>
            </div>
            <div class="chip-row">
              <v-btn variant="outlined" size="small" prepend-icon="mdi-refresh" @click="regenerateDndData">
                Regenerate
              </v-btn>
              <v-btn variant="text" size="small" @click="resetDndOrder">Reset Order</v-btn>
            </div>
          </DemoSection>

          <DemoSection title="Live Table" subtitle="Header order matches the list above">
            <div class="table-scroll">
              <table class="grouped-table grouped-table--dense">
                <thead>
                  <tr>
                    <th v-for="(column, index) in dndColumns" :key="column.key">
                      <div class="dnd-header">
                        <v-icon size="14">mdi-drag-horizontal-variant</v-icon>
                        <span>{{ column.title }}</span>
                        <v-btn
                          icon="mdi-arrow-up"
                          size="x-small"
                          variant="text"
                          :disabled="index === 0"
                          :aria-label="`Move ${column.title} up`"
                          @click="moveColumn(index, -1)"
                        />
                        <v-btn
                          icon="mdi-arrow-down"
                          size="x-small"
                          variant="text"
                          :disabled="index === dndColumns.length - 1"
                          :aria-label="`Move ${column.title} down`"
                          @click="moveColumn(index, 1)"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in dndRows" :key="row.id">
                    <td v-for="column in dndColumns" :key="column.key">
                      <v-chip v-if="column.key === 'status'" size="x-small" :color="statusColor(row.status)" variant="tonal">
                        {{ statusLabel(row.status) }}
                      </v-chip>
                      <span v-else-if="column.key === 'progress'">{{ row.progress }}%</span>
                      <span v-else>{{ row[column.key] }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DemoSection>

          <DemoSection title="Row Data Preview" subtitle="Same source data rendered as JSON">
            <pre class="code-block">{{ JSON.stringify(dndRows.slice(0, 3), null, 2) }}</pre>
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

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.data-table,
.compact-table {
  background: transparent;
}

.compact-table {
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 130px;
}

.progress-value {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
  min-width: 32px;
  text-align: right;
}

.table-scroll {
  max-height: 420px;
  overflow: auto;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 10px;
}

.grouped-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.grouped-table th,
.grouped-table td {
  padding: 9px 12px;
  text-align: left;
  border-right: 1px solid rgb(var(--v-border-color));
  border-bottom: 1px solid rgb(var(--v-border-color));
  white-space: nowrap;
}

.grouped-table th:last-child,
.grouped-table td:last-child {
  border-right: 0;
}

.grouped-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.grouped-table thead th {
  background: rgb(var(--v-theme-surface-variant));
  font-weight: 600;
  font-size: 12px;
}

.grouped-table--dense th,
.grouped-table--dense td {
  padding: 5px 10px;
}

.grouped-table tbody tr:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.empty-cell {
  padding: 24px 12px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
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

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.pagination-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.column-panel {
  max-width: 280px;
  padding: 10px 12px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 10px;
}

.dnd-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 420px;
}

.dnd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
}

.dnd-title {
  font-size: 13px;
}

.dnd-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 900px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .filter-bar {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
