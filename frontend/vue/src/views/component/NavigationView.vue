<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.component')
const tab = ref('overview')
const step = ref(1)
const page = ref(2)
const nav = ref('dashboard')
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.navigation')" />

    <DemoSection title="Tabs" subtitle="v-tabs with animated content">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="members">Members</v-tab>
        <v-tab value="settings">Settings</v-tab>
        <v-tab value="disabled" disabled>Disabled</v-tab>
      </v-tabs>
      <v-window v-model="tab" class="tab-window">
        <v-window-item value="overview">
          <p class="text-body-2">Overview panel · metrics, recent activity and quick actions.</p>
        </v-window-item>
        <v-window-item value="members">
          <p class="text-body-2">Members panel · role assignments and direct permissions.</p>
        </v-window-item>
        <v-window-item value="settings">
          <p class="text-body-2">Settings panel · locale, theme and notification preferences.</p>
        </v-window-item>
      </v-window>
    </DemoSection>

    <div class="two-col">
      <DemoSection title="Breadcrumbs">
        <v-breadcrumbs :items="['Home', 'System', 'Users']" density="comfortable">
          <template #divider><v-icon size="16">mdi-chevron-right</v-icon></template>
        </v-breadcrumbs>
        <v-breadcrumbs :items="['Console', 'Charts', 'ECharts']" density="compact" />
      </DemoSection>

      <DemoSection title="Pagination">
        <v-pagination v-model="page" :length="8" :total-visible="6" />
        <div class="text-caption text-medium-emphasis">Page {{ page }} / 8</div>
        <v-pagination :length="4" total-visible="4" density="compact" />
      </DemoSection>
    </div>

    <DemoSection title="Stepper" subtitle="Linear flow with validation state">
      <v-stepper v-model="step" :items="['Account', 'Organization', 'Permissions', 'Review']" flat>
        <template #item.1>
          <p class="text-body-2 mb-3">Create the account, choose a username and a strong password.</p>
        </template>
        <template #item.2>
          <p class="text-body-2 mb-3">Attach the account to an organization code from the tree.</p>
        </template>
        <template #item.3>
          <p class="text-body-2 mb-3">Grant roles and direct permissions; super requires a super actor.</p>
        </template>
        <template #item.4>
          <p class="text-body-2 mb-3">Review the summary and submit. A temporary password is shown once.</p>
        </template>
        <template #actions>
          <v-btn variant="text" :disabled="step === 1" @click="step -= 1">Back</v-btn>
          <v-spacer />
          <v-btn color="primary" :disabled="step === 4" @click="step += 1">Next</v-btn>
        </template>
      </v-stepper>
    </DemoSection>

    <div class="two-col">
      <DemoSection title="Navigation list">
        <v-list nav density="comfortable">
          <v-list-subheader>Workspace</v-list-subheader>
          <v-list-item
            value="dashboard"
            prepend-icon="mdi-view-dashboard-outline"
            title="Dashboard"
            :active="nav === 'dashboard'"
            @click="nav = 'dashboard'"
          />
          <v-list-item
            value="users"
            prepend-icon="mdi-account-multiple-outline"
            title="Users"
            :active="nav === 'users'"
            @click="nav = 'users'"
          />
          <v-list-item
            value="roles"
            prepend-icon="mdi-shield-account-outline"
            title="Roles"
            :active="nav === 'roles'"
            @click="nav = 'roles'"
          />
          <v-divider class="my-2" />
          <v-list-item
            value="settings"
            prepend-icon="mdi-cog-outline"
            title="Settings"
            :active="nav === 'settings'"
            @click="nav = 'settings'"
          />
        </v-list>
      </DemoSection>

      <DemoSection title="Menus & speed dial">
        <div class="row">
          <v-menu>
            <template #activator="{ props: activatorProps }">
              <v-btn v-bind="activatorProps" variant="outlined" append-icon="mdi-chevron-down">
                Actions
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil-outline" title="Edit" />
              <v-list-item prepend-icon="mdi-content-duplicate" title="Duplicate" />
              <v-list-item prepend-icon="mdi-delete-outline" title="Delete" base-color="error" />
            </v-list>
          </v-menu>

          <v-menu location="right">
            <template #activator="{ props: activatorProps }">
              <v-btn v-bind="activatorProps" color="primary" prepend-icon="mdi-share-variant">
                Share
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-link" title="Copy link" />
              <v-list-item prepend-icon="mdi-email-outline" title="Email" />
              <v-list-item prepend-icon="mdi-chat-outline" title="Message" />
            </v-list>
          </v-menu>
        </div>

        <v-speed-dial location="bottom center">
          <template #activator="{ props: activatorProps }">
            <v-btn v-bind="activatorProps" color="primary" icon="mdi-plus" aria-label="Quick actions" />
          </template>
          <v-btn key="user" icon="mdi-account-plus" aria-label="Add user" />
          <v-btn key="role" icon="mdi-shield-plus" aria-label="Add role" />
          <v-btn key="group" icon="mdi-office-building-plus" aria-label="Add group" />
        </v-speed-dial>
      </DemoSection>
    </div>
  </div>
</template>

<style scoped>
.tab-window {
  padding: 12px 4px;
  min-height: 60px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
