<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePageTitle } from '@/composables/usePageTitle'
import D3Chart from '@/components/demo/D3Chart.vue'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const title = usePageTitle('page.title.chart')
</script>

<template>
  <div class="demo-page">
    <PageHeader :title="title" :subtitle="t('page.chart.d3')" />

    <div class="demo-grid demo-grid--2">
      <D3Chart kind="line" :title="t('chart.line')" :height="320" />
      <D3Chart kind="bar" :title="t('chart.bar')" :height="320" />
      <D3Chart kind="scatter" :title="t('chart.scatter')" :height="320" />
      <D3Chart kind="donut" :title="t('chart.donut')" :height="320" />
    </div>
  </div>
</template>
