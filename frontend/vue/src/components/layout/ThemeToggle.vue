<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const ui = useUiStore()
</script>

<template>
  <v-btn
    variant="text"
    data-testid="theme-toggle"
    :icon="ui.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
    :aria-label="ui.dark ? t('header.theme.light') : t('header.theme.dark')"
    @click="ui.setDark(!ui.dark)"
  />
</template>
