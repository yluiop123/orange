<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'

const auth = useAuthStore()

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
      <div class="page-container">
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
  background:
    radial-gradient(circle at 100% 0%, rgba(251, 146, 60, 0.08), transparent 32%),
    rgb(var(--v-theme-background));
}

.page-container {
  min-height: calc(100vh - 64px);
  padding: 16px;
}

@media (max-width: 600px) {
  .page-container {
    padding: 10px;
  }
}
</style>
