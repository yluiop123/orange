<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')

type Person = {
  id: number
  name: string
  username: string
  group: string
  status: string
  created: string
}

const people: Person[] = [
  { id: 1, name: '林一', username: 'linyi', group: '前端组', status: '1', created: '2026-01-05' },
  { id: 2, name: '陈二', username: 'chener', group: '前端组', status: '1', created: '2026-01-08' },
  { id: 3, name: '张三', username: 'zhangsan', group: '后端组', status: '1', created: '2026-01-12' },
  { id: 4, name: '李四', username: 'lisi', group: '后端组', status: '0', created: '2026-01-19' },
  { id: 5, name: '王五', username: 'wangwu', group: '华东区', status: '1', created: '2026-02-02' },
  { id: 6, name: '赵六', username: 'zhaoliu', group: '华东区', status: '1', created: '2026-02-11' },
  { id: 7, name: '孙七', username: 'sunqi', group: '会计组', status: '0', created: '2026-02-18' },
  { id: 8, name: '周八', username: 'zhouba', group: '研发部', status: '1', created: '2026-02-26' },
  { id: 9, name: '吴九', username: 'wujiu', group: '市场部', status: '1', created: '2026-03-04' },
  { id: 10, name: '郑十', username: 'zhengshi', group: '财务部', status: '1', created: '2026-03-13' },
  { id: 11, name: '钱十一', username: 'qian11', group: '研发部', status: '1', created: '2026-03-20' },
  { id: 12, name: '冯十二', username: 'feng12', group: '市场部', status: '0', created: '2026-03-29' },
]

const search = ref('')
const selected = ref<Person[]>([])
const headers = computed(() => [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Group', key: 'group' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
])

const compact = people.slice(0, 5)
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.table')" />

    <DemoSection
      title="v-data-table"
      subtitle="Search, server-style pagination, multi-select and sortable headers"
    >
      <template #actions>
        <v-chip v-if="selected.length" size="small" color="primary" variant="tonal">
          {{ selected.length }} selected
        </v-chip>
      </template>
      <div class="table-toolbar">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width: 280px"
        />
        <v-spacer />
        <v-btn variant="outlined" prepend-icon="mdi-download" @click="selected = []">
          Clear selection
        </v-btn>
      </div>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="people"
        :search="search"
        item-value="id"
        show-select
        :items-per-page="5"
        density="comfortable"
        class="data-table"
      >
        <template #item.status="{ item }">
          <v-chip size="small" :color="item.status === '1' ? 'success' : 'default'" variant="tonal">
            {{ item.status === '1' ? t('dict.status.enabled') : t('dict.status.disabled') }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil-outline" size="small" variant="text" :aria-label="`Edit ${item.name}`" />
          <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" :aria-label="`Delete ${item.name}`" />
        </template>
      </v-data-table>
    </DemoSection>

    <div class="two-col">
      <DemoSection title="Compact table" subtitle="Dense rows and custom cells">
        <v-table density="compact" class="compact-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th class="text-end">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in compact" :key="row.id">
              <td><code class="mono">{{ row.username }}</code></td>
              <td>{{ row.name }}</td>
              <td>{{ row.group }}</td>
              <td class="text-end">
                <v-icon
                  :color="row.status === '1' ? 'success' : 'error'"
                  size="18"
                  :aria-label="row.status === '1' ? 'Enabled' : 'Disabled'"
                >
                  {{ row.status === '1' ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}
                </v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </DemoSection>

      <DemoSection title="Virtual & loading states" subtitle="Skeleton rows while fetching">
        <v-skeleton-loader type="table-row@4" />
        <div class="empty-note">
          <v-icon size="20">mdi-table-question</v-icon>
          <span>Empty state uses the same table shell and a retry action.</span>
        </div>
      </DemoSection>
    </div>
  </div>
</template>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.empty-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px;
  border: 1px dashed rgba(var(--v-border-color), 0.8);
  border-radius: 10px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
