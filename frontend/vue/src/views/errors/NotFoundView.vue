<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="status-page">
    <div class="status-code">404</div>
    <h1>{{ t('page.notfound.title') }}</h1>
    <p>{{ t('page.notfound.desc') }}</p>
    <v-btn color="primary" prepend-icon="mdi-home-outline" class="mt-4" @click="router.push('/')">
      {{ t('page.notfound.home') }}
    </v-btn>
  </div>
</template>

<style scoped>
.status-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px;
  text-align: center;
}

.status-code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  color: rgb(var(--v-theme-primary));
  opacity: 0.9;
}

h1 {
  font-size: 24px;
  font-weight: 700;
}

p {
  max-width: 460px;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
