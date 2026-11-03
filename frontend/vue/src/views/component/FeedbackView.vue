<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const ui = useUiStore()
const title = usePageTitle('page.title.component')

const dialog = ref(false)
const confirm = ref(false)
const overlay = ref(false)
const alert = ref(true)
const progress = ref(62)
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.feedback')" />

    <v-row dense>
      <v-col cols="12" md="6">
        <DemoSection title="Alerts">
          <v-alert type="success" variant="tonal" density="compact">Operation completed successfully.</v-alert>
          <v-alert type="info" variant="tonal" density="compact">The menu tree comes from the backend.</v-alert>
          <v-alert type="warning" variant="tonal" density="compact">Disabling a parent requires disabling its children first.</v-alert>
          <v-alert type="error" variant="tonal" density="compact" title="Request failed">
            traceId 9f8c1b2d3e4f5a6b · HTTP 403 · 40302
          </v-alert>
          <v-alert v-if="alert" type="info" variant="outlined" closable @click:close="alert = false">
            Dismissible alert. Click the close icon.
          </v-alert>
          <v-btn v-if="!alert" variant="text" size="small" @click="alert = true">Restore alert</v-btn>
        </DemoSection>
      </v-col>

      <v-col cols="12" md="6">
        <DemoSection title="Dialogs & overlay">
          <div class="row">
            <v-btn color="primary" @click="dialog = true">Open dialog</v-btn>
            <v-btn color="error" variant="tonal" @click="confirm = true">Destructive confirm</v-btn>
            <v-btn variant="outlined" @click="overlay = true">Overlay</v-btn>
          </div>
          <p class="demo-note">
            Dialogs trap focus and expose an accessible title. Destructive actions always ask first.
          </p>

          <v-dialog v-model="dialog" max-width="480">
            <v-card title="Dialog title">
              <v-card-text>
                A modal surface for forms, details and confirmations. Press Escape or click outside to
                dismiss.
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="dialog = false">Confirm</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog v-model="confirm" max-width="440" persistent>
            <v-card title="Delete this record?">
              <v-card-text>This action cannot be undone.</v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="confirm = false">Cancel</v-btn>
                <v-btn color="error" @click="confirm = false">Delete</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-overlay v-model="overlay" class="align-center justify-center" persistent>
            <v-card class="overlay-card">
              <v-card-title>Working…</v-card-title>
              <v-card-text>
                <v-progress-linear indeterminate color="primary" />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="overlay = false">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
        </DemoSection>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" md="4">
        <DemoSection title="Snackbar">
          <div class="row">
            <v-btn size="small" color="success" @click="ui.notify(t('message.success'), 'success')">Success</v-btn>
            <v-btn size="small" color="error" @click="ui.notify('Something went wrong', 'error')">Error</v-btn>
            <v-btn size="small" color="warning" @click="ui.notify('Check the filters', 'warning')">Warning</v-btn>
            <v-btn size="small" color="info" @click="ui.notify('Menu updated', 'info')">Info</v-btn>
          </div>
          <p class="demo-note">The global snackbar lives in App.vue and is used by the HTTP interceptor.</p>
        </DemoSection>
      </v-col>

      <v-col cols="12" md="4">
        <DemoSection title="Progress">
          <v-progress-linear :model-value="progress" color="primary" height="10" rounded />
          <v-progress-linear indeterminate color="info" />
          <div class="row">
            <v-progress-circular :model-value="progress" color="primary" size="52" width="6">
              {{ progress }}%
            </v-progress-circular>
            <v-progress-circular indeterminate color="warning" size="36" width="4" />
            <v-progress-circular indeterminate color="success" size="28" width="3" />
          </div>
          <v-slider v-model="progress" :min="0" :max="100" hide-details density="compact" />
        </DemoSection>
      </v-col>

      <v-col cols="12" md="4">
        <DemoSection title="Skeleton">
          <v-skeleton-loader type="avatar, article, actions" />
          <v-skeleton-loader type="list-item-two-line@3" />
        </DemoSection>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.overlay-card {
  width: 320px;
}
</style>
