<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')
const auth = useAuthStore()
const ui = useUiStore()

const spark = [18, 24, 20, 31, 28, 39, 36, 46, 43, 52]

const sparkPath = computed(() => {
  const width = 260
  const height = 72
  const max = Math.max(...spark)
  const min = Math.min(...spark)
  return spark
    .map((value, index) => {
      const x = (index / (spark.length - 1)) * width
      const y = height - ((value - min) / (max - min || 1)) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const activities = [
  { icon: 'mdi-shield-check-outline', color: 'success', title: 'Role super granted 12 permissions', time: '2m ago' },
  { icon: 'mdi-account-plus-outline', color: 'primary', title: 'New user newbie created', time: '18m ago' },
  { icon: 'mdi-key-outline', color: 'info', title: 'Permission 000504 synced', time: '1h ago' },
  { icon: 'mdi-alert-outline', color: 'warning', title: 'Login lockout triggered', time: '3h ago' },
]

const coverage = [
  { label: 'Menus', value: 92 },
  { label: 'Actions', value: 68 },
  { label: 'Directories', value: 100 },
]
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.custom')" />

    <div class="custom-grid">
      <v-card variant="flat" class="profile-card">
        <div class="profile-bg" />
        <div class="profile-body">
          <v-avatar size="72" color="primary" class="profile-avatar">
            <span class="text-h5">{{ (auth.userInfo?.name || 'O').slice(0, 1) }}</span>
          </v-avatar>
          <div class="profile-name">{{ auth.userInfo?.name || 'ORANGE User' }}</div>
          <div class="profile-meta">
            {{ auth.userInfo?.username || 'super' }} · {{ auth.userInfo?.groupName || '总公司' }}
          </div>
          <div class="profile-chips">
            <v-chip v-for="role in auth.roles" :key="role.id" size="small" variant="tonal" color="primary">
              {{ role.name }}
            </v-chip>
          </div>
          <div class="profile-actions">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-account-edit-outline" block>
              Edit profile
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-lock-reset" block @click="ui.notify('Use the header menu to change the password', 'info')">
              Change password
            </v-btn>
          </div>
        </div>
      </v-card>

      <v-card variant="flat" class="custom-card">
        <div class="custom-head">
          <div>
            <div class="custom-title">Access coverage</div>
            <div class="custom-sub">Current role view</div>
          </div>
          <v-chip size="small" color="success" variant="tonal">UI only</v-chip>
        </div>
        <div v-for="item in coverage" :key="item.label" class="coverage-row">
          <span>{{ item.label }}</span>
          <v-progress-linear :model-value="item.value" color="primary" height="7" rounded />
          <span class="mono">{{ item.value }}%</span>
        </div>
      </v-card>

      <v-card variant="flat" class="custom-card">
        <div class="custom-head">
          <div>
            <div class="custom-title">Weekly activity</div>
            <div class="custom-sub">Writes recorded by the operation log</div>
          </div>
          <span class="trend">+18.4%</span>
        </div>
        <svg viewBox="0 0 260 80" class="spark" role="img" aria-label="Weekly activity trend">
          <path :d="sparkPath" fill="none" stroke="#ea580c" stroke-width="3" stroke-linecap="round" />
          <path :d="`${sparkPath} L 260 80 L 0 80 Z`" fill="rgba(234,88,12,0.12)" />
        </svg>
        <div class="spark-labels">
          <span v-for="(value, index) in spark" :key="index" class="mono">{{ value }}</span>
        </div>
      </v-card>

      <v-card variant="flat" class="custom-card">
        <div class="custom-head">
          <div class="custom-title">Activity</div>
          <v-btn size="small" variant="text" append-icon="mdi-arrow-right">All</v-btn>
        </div>
        <div class="activity-list">
          <div v-for="activity in activities" :key="activity.title" class="activity">
            <v-avatar size="32" :color="activity.color" variant="tonal">
              <v-icon size="18">{{ activity.icon }}</v-icon>
            </v-avatar>
            <div class="activity-main">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-time">{{ activity.time }}</div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card variant="flat" class="custom-card status-card">
        <div class="status-head">
          <span class="pulse" />
          <div>
            <div class="custom-title">System healthy</div>
            <div class="custom-sub">API · Redis · PostgreSQL · object storage</div>
          </div>
        </div>
        <div class="status-grid">
          <div><strong>42ms</strong><span>API p95</span></div>
          <div><strong>0.02%</strong><span>Error rate</span></div>
          <div><strong>99.98%</strong><span>Uptime</span></div>
        </div>
      </v-card>
    </div>

    <DemoSection title="Composition notes">
      <p class="text-body-2 text-medium-emphasis">
        This page composes Vuetify surfaces with local SVG, instead of relying on a chart library.
        It demonstrates that the shell can host custom product blocks: profile, access coverage,
        trend, activity and health.
      </p>
    </DemoSection>
  </div>
</template>

<style scoped>
.custom-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.profile-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.profile-bg {
  height: 92px;
  background:
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.35), transparent 40%),
    linear-gradient(135deg, #ea580c, #f59e0b);
}

.profile-body {
  padding: 0 20px 20px;
  margin-top: -36px;
}

.profile-avatar {
  border: 3px solid rgb(var(--v-theme-surface));
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  margin-top: 8px;
}

.profile-meta {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.profile-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 10px 0 14px;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-card {
  padding: 16px 18px;
  border: 1px solid rgba(var(--v-border-color), 0.6);
}

.custom-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.custom-title {
  font-size: 14px;
  font-weight: 650;
}

.custom-sub {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.coverage-row {
  display: grid;
  grid-template-columns: 80px 1fr 44px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  margin-bottom: 12px;
}

.trend {
  font-size: 12px;
  font-weight: 650;
  color: #16a34a;
}

.spark {
  width: 100%;
  height: 80px;
  display: block;
}

.spark-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-title {
  font-size: 12px;
}

.activity-time {
  font-size: 10px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.status-card {
  background:
    radial-gradient(circle at 100% 0%, rgba(34, 197, 94, 0.16), transparent 50%),
    rgb(var(--v-theme-surface));
}

.status-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.16);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.status-grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-grid strong {
  font-size: 18px;
}

.status-grid span {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

@media (max-width: 1100px) {
  .custom-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .custom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
