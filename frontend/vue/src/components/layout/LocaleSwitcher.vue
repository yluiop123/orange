<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale, type AppLocale } from '@/i18n'

const emit = defineEmits<{ changed: [locale: AppLocale] }>()
const { t, locale } = useI18n()

const current = computed(
  () => SUPPORTED_LOCALES.find((item) => item.id === locale.value) ?? SUPPORTED_LOCALES[0],
)

function select(next: AppLocale) {
  if (next === locale.value) return
  setLocale(next)
  emit('changed', next)
}
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        variant="text"
        size="small"
        prepend-icon="mdi-translate"
        class="locale-switcher"
        data-testid="locale-switcher"
        :aria-label="t('header.language')"
      >
        {{ current.label }}
      </v-btn>
    </template>
    <v-list density="compact" class="language-menu">
      <v-list-item
        v-for="item in SUPPORTED_LOCALES"
        :key="item.id"
        :title="item.label"
        @click="select(item.id)"
      >
        <template v-if="locale === item.id" #append>
          <v-icon size="16">mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>
.locale-switcher {
  min-width: 0;
}

.language-menu {
  min-width: 140px;
  padding: 4px;
}

.language-menu :deep(.v-list-item) {
  min-height: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
