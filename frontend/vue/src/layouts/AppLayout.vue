<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'

const auth = useAuthStore()
const route = useRoute()

// System pages own their 12px padding and fill the viewport below the header.
const flush = computed(() => route.path.startsWith('/system'))

const forcedOpen = computed({
  get: () => auth.mustChangePassword,
  set: () => {
    // A forced change is never dismissible; the dialog clears the session itself.
  },
})
</script>

<template>
  <v-layout class="app-shell">
    <AppSidebar />
    <AppHeader />
    <v-main class="app-main">
      <div class="page-container" :class="{ 'page-container--flush': flush }">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </div>
    </v-main>
    <ChangePasswordDialog v-model="forcedOpen" forced />
  </v-layout>
</template>

<style scoped>
.app-main {
  height: 100vh;
  overflow-y: auto;
  background: rgb(var(--v-theme-background));
}

.app-shell {
  height: 100vh;
  overflow: hidden;
}

.page-container {
  min-height: calc(100vh - var(--orange-header-height));
  padding: var(--orange-page-padding);
}

.page-container--flush {
  min-height: calc(100svh - var(--orange-header-height));
  padding: 0;
}

@media (max-width: 600px) {
  .page-container {
    padding: var(--orange-page-padding);
  }
}
</style>
