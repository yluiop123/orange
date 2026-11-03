<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/PageHeader.vue'
import DemoSection from '@/components/demo/DemoSection.vue'

const { t } = useI18n()
const ui = useUiStore()
const title = usePageTitle('page.title.component')

const form = reactive({
  name: '林一',
  email: 'linyi@example.com',
  password: '',
  group: '000100',
  role: ['admin'],
  bio: 'Front-end engineer working on the admin console.',
  plan: 'pro',
  notifications: true,
  volume: 64,
  rating: 4,
  birth: '1996-08-16',
  startTime: '09:30',
})

const valid = ref(true)
const files = ref<File[]>([])
const groups = [
  { title: '研发部 / 前端组', value: '000100' },
  { title: '研发部 / 后端组', value: '000101' },
  { title: '市场部 / 华东区', value: '000200' },
  { title: '财务部 / 会计组', value: '000300' },
]
const roles = ['super', 'admin', 'user', 'auditor']

const required = (value: unknown) => Boolean(String(value ?? '').trim()) || 'Required'
const email = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '')) || 'Invalid email'
const minLength = (value: unknown) =>
  String(value ?? '').length >= 8 || 'At least 8 characters'

function submit() {
  if (!valid.value) {
    ui.notify('Please fix the form errors', 'warning')
    return
  }
  ui.notify(t('message.success'), 'success')
}

function reset() {
  form.name = ''
  form.email = ''
  form.password = ''
  form.group = ''
  form.role = []
  form.bio = ''
  files.value = []
}
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.component.form')" />

    <v-row dense>
      <v-col cols="12" lg="8">
        <DemoSection title="Account form" subtitle="v-form with rules, selects and state">
          <v-form v-model="valid" @submit.prevent="submit">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.name" label="Name" :rules="[required]" prepend-inner-icon="mdi-account-outline" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.email" label="Email" :rules="[required, email]" prepend-inner-icon="mdi-email-outline" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.password"
                  label="Password"
                  type="password"
                  :rules="[required, minLength]"
                  hint="At least 8 characters"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.group" :items="groups" label="Organization" :rules="[required]" />
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.role"
                  :items="roles"
                  label="Roles"
                  multiple
                  chips
                  closable-chips
                  hint="Only a super may grant super"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea v-model="form.bio" label="Bio" rows="3" auto-grow />
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <v-row dense>
              <v-col cols="12" md="6">
                <div class="field-label">Plan</div>
                <v-radio-group v-model="form.plan" inline hide-details>
                  <v-radio label="Free" value="free" />
                  <v-radio label="Pro" value="pro" />
                  <v-radio label="Enterprise" value="enterprise" />
                </v-radio-group>
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">Preferences</div>
                <v-checkbox v-model="form.notifications" label="Email notifications" density="compact" hide-details />
                <v-switch v-model="form.notifications" label="Realtime alerts" color="primary" density="compact" hide-details />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">Volume · {{ form.volume }}</div>
                <v-slider v-model="form.volume" :min="0" :max="100" step="1" thumb-label color="primary" hide-details />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">Rating</div>
                <v-rating v-model="form.rating" color="warning" density="compact" hover />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.birth" label="Birth date" type="date" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.startTime" label="Start time" type="time" />
              </v-col>
              <v-col cols="12" md="4">
                <v-file-input v-model="files" label="Attachments" multiple prepend-icon="mdi-paperclip" show-size />
              </v-col>
            </v-row>

            <div class="form-actions">
              <v-btn variant="text" @click="reset">Reset</v-btn>
              <v-btn color="primary" type="submit" prepend-icon="mdi-content-save-outline">Submit</v-btn>
            </div>
          </v-form>
        </DemoSection>
      </v-col>

      <v-col cols="12" lg="4">
        <DemoSection title="Selection controls">
          <v-checkbox label="Checkbox" hide-details />
          <v-checkbox label="Checked + indeterminate" checked indeterminate hide-details />
          <v-radio-group hide-details>
            <v-radio label="Radio A" value="a" />
            <v-radio label="Radio B" value="b" />
          </v-radio-group>
          <v-switch label="Switch on" color="primary" :model-value="true" hide-details />
          <v-switch label="Switch off" :model-value="false" hide-details />
        </DemoSection>

        <DemoSection title="Inputs">
          <v-text-field label="Default" />
          <v-text-field label="With prefix" prefix="¥" model-value="1,280" />
          <v-text-field label="Disabled" disabled model-value="Read only" />
          <v-text-field label="Error state" error-messages="This field is required" model-value="" />
          <v-combobox
            label="Combobox"
            :items="['Vue', 'Vuetify', 'Pinia', 'Vite']"
            multiple
            chips
          />
          <v-number-input :model-value="42" label="Number" :min="0" :max="100" control-variant="stacked" />
        </DemoSection>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.field-label {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
