<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const ui = useUiStore()

const open = computed({
  get: () => ui.forbidden.show,
  set: (value: boolean) => {
    if (!value) ui.forbidden = { show: false, message: '', path: '' }
  },
})
</script>

<template>
  <v-dialog v-model="open" max-width="460">
    <v-card :title="t('page.forbidden.action.title')">
      <v-card-text>
        <p class="text-body-2 mb-2">{{ ui.forbidden.message || t('page.forbidden.action.desc') }}</p>
        <p v-if="ui.forbidden.path" class="text-caption text-medium-emphasis">
          <code>{{ ui.forbidden.path }}</code>
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="open = false">
          {{ t('page.forbidden.action.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
