<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type DateTimeRangeValue = {
  /** Local time, `yyyy-MM-ddTHH:mm`; an empty string means "not selected". */
  from: string
  to: string
}

const props = defineProps<{ modelValue: DateTimeRangeValue }>()
const emit = defineEmits<{ 'update:modelValue': [value: DateTimeRangeValue] }>()

const { t } = useI18n()
const open = ref(false)
const rightMonth = ref<number | undefined>(undefined)
const rightYear = ref<number | undefined>(undefined)

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function dayString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function today() {
  return dayString(new Date())
}

function dayPart(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : ''
}

function timePart(value: string, fallback: string) {
  const match = /T(\d{2}:\d{2})/.exec(value)
  return match?.[1] ?? fallback
}

function toDay(value: unknown) {
  if (typeof value === 'string') return dayPart(value)
  if (value instanceof Date) return dayString(value)
  return ''
}

const fromDay = computed(() => dayPart(props.modelValue.from))
const toDayValue = computed(() => dayPart(props.modelValue.to))
const fromTime = computed(() => timePart(props.modelValue.from, '00:00'))
const toTime = computed(() => timePart(props.modelValue.to, '23:59'))
const hasValue = computed(() => Boolean(fromDay.value || toDayValue.value))

function syncRightCalendar() {
  const base = fromDay.value ? new Date(`${fromDay.value}T00:00:00`) : new Date()
  const next = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  rightMonth.value = next.getMonth()
  rightYear.value = next.getFullYear()
}

watch(open, (value) => {
  if (value) syncRightCalendar()
})

const label = computed(() => {
  if (!fromDay.value || !toDayValue.value) {
    return t('page.system.operationLog.dateRange')
  }
  return `${fromDay.value} ${fromTime.value} ~ ${toDayValue.value} ${toTime.value}`
})

function update(from: string, to: string) {
  emit('update:modelValue', { from, to })
}

function selectFrom(value: unknown) {
  const day = toDay(value)
  if (!day) {
    update('', props.modelValue.to)
    return
  }
  update(`${day}T${fromTime.value}`, props.modelValue.to || `${day}T23:59`)
}

function selectTo(value: unknown) {
  const day = toDay(value)
  if (!day) {
    update(props.modelValue.from, '')
    return
  }
  update(props.modelValue.from || `${day}T00:00`, `${day}T${toTime.value}`)
}

function onFromTime(event: Event) {
  const time = (event.target as HTMLInputElement).value
  if (!time) return
  const day = fromDay.value || toDayValue.value || today()
  update(`${day}T${time}`, props.modelValue.to || `${toDayValue.value || day}T23:59`)
}

function onToTime(event: Event) {
  const time = (event.target as HTMLInputElement).value
  if (!time) return
  const day = toDayValue.value || fromDay.value || today()
  update(props.modelValue.from || `${fromDay.value || day}T00:00`, `${day}T${time}`)
}

function selectToday() {
  const day = today()
  update(`${day}T00:00`, `${day}T23:59`)
}

function clear() {
  update('', '')
}
</script>

<template>
  <v-menu v-model="open" location="bottom start" :close-on-content-click="false" offset="4">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        variant="outlined"
        class="system-date-range"
        :aria-label="t('page.system.operationLog.dateRange')"
      >
        <v-icon size="18">mdi-calendar-blank-outline</v-icon>
        <span class="system-date-range__label">{{ label }}</span>
        <v-icon
          v-if="hasValue"
          class="system-date-range__clear"
          icon="mdi-close"
          size="16"
          role="button"
          tabindex="0"
          :aria-label="t('button.clear')"
          @click.stop="clear"
          @keydown.enter.stop.prevent="clear"
          @keydown.space.stop.prevent="clear"
        />
      </v-btn>
    </template>

    <div class="system-date-menu">
      <div class="system-date-calendars">
        <div class="system-date-calendar">
          <div class="system-date-calendar__caption">
            {{ t('page.system.operationLog.header.from') }}
          </div>
          <v-date-picker
            :model-value="fromDay || null"
            color="primary"
            density="compact"
            show-adjacent-months
            @update:model-value="selectFrom"
          />
        </div>
        <div class="system-date-calendar">
          <div class="system-date-calendar__caption">
            {{ t('page.system.operationLog.header.to') }}
          </div>
          <v-date-picker
            v-model:month="rightMonth"
            v-model:year="rightYear"
            :model-value="toDayValue || null"
            color="primary"
            density="compact"
            show-adjacent-months
            @update:model-value="selectTo"
          />
        </div>
      </div>

      <div class="system-date-times">
        <div class="system-time-field">
          <label for="date-range-from">{{ t('page.system.operationLog.header.from') }}</label>
          <input
            id="date-range-from"
            class="system-time-input"
            type="time"
            :value="fromDay ? fromTime : ''"
            :disabled="!fromDay"
            @change="onFromTime"
          />
        </div>
        <div class="system-time-field">
          <label for="date-range-to">{{ t('page.system.operationLog.header.to') }}</label>
          <input
            id="date-range-to"
            class="system-time-input"
            type="time"
            :value="toDayValue ? toTime : ''"
            :disabled="!toDayValue"
            @change="onToTime"
          />
        </div>
        <div class="system-date-actions">
          <v-btn variant="text" size="small" @click="clear">
            {{ t('button.clear') }}
          </v-btn>
          <v-btn variant="outlined" size="small" @click="selectToday">
            {{ t('page.system.operationLog.today') }}
          </v-btn>
        </div>
      </div>
    </div>
  </v-menu>
</template>
