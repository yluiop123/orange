<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import ForbiddenDialog from '@/components/ForbiddenDialog.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const theme = useTheme()

watch(
  () => ui.dark,
  (dark) => {
    theme.change(dark ? 'dark' : 'light')
  },
  { immediate: true },
)
</script>

<template>
  <v-app>
    <router-view />
    <ForbiddenDialog />
    <v-snackbar
      v-model="ui.snackbar.show"
      :color="ui.snackbar.color"
      :timeout="3200"
      location="bottom right"
      rounded="lg"
    >
      {{ ui.snackbar.text }}
    </v-snackbar>
  </v-app>
</template>
