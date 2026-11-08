<script setup lang="ts">
/**
 * Frontend-owned Swagger page. `public/openapi.json` is committed with the app,
 * so the documentation never follows a running backend.
 */
const swaggerUrl = `${import.meta.env.BASE_URL}swagger.html`
</script>

<template>
  <iframe
    class="swagger-frame"
    title="Orange API documentation"
    :src="swaggerUrl"
  />
</template>

<style scoped>
.swagger-frame {
  display: block;
  width: 100%;
  height: 100vh;
  border: 0;
}
</style>
