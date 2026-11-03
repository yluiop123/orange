<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { changePassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    forced?: boolean
  }>(),
  { forced: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (props.forced) return
    emit('update:modelValue', value)
  },
})

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const error = ref('')
const submitting = ref(false)

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      form.oldPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
      error.value = ''
    }
  },
)

async function submit() {
  error.value = ''
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(form.newPassword)) {
    error.value = t('password.change.min')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    error.value = t('password.change.mismatch')
    return
  }
  submitting.value = true
  try {
    await changePassword(form.oldPassword, form.newPassword)
    ui.notify(t('password.change.success'), 'success')
    emit('update:modelValue', false)
    auth.clearSession()
    await router.replace('/login')
  } catch {
    // The interceptor reports the server error.
  } finally {
    submitting.value = false
  }
}

async function signOut() {
  auth.logout()
  emit('update:modelValue', false)
  await router.replace('/login')
}
</script>

<template>
  <v-dialog v-model="open" max-width="520" :persistent="forced" :close-on-content-click="false">
    <v-card>
      <v-card-title>
        {{ forced ? t('password.change.force.title') : t('password.change.title') }}
      </v-card-title>
      <v-card-subtitle class="pb-2">
        {{ forced ? t('password.change.force.desc') : t('password.change.desc') }}
      </v-card-subtitle>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="form.oldPassword"
            :label="t('password.change.old')"
            type="password"
            autocomplete="current-password"
            :disabled="submitting"
            required
          />
          <v-text-field
            v-model="form.newPassword"
            :label="t('password.change.new')"
            type="password"
            autocomplete="new-password"
            :disabled="submitting"
            required
          />
          <v-text-field
            v-model="form.confirmPassword"
            :label="t('password.change.confirm')"
            type="password"
            autocomplete="new-password"
            :disabled="submitting"
            required
          />
          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
            {{ error }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="forced" variant="text" @click="signOut">
          {{ t('sidebar.user.logout') }}
        </v-btn>
        <v-spacer />
        <v-btn v-if="!forced" variant="text" @click="emit('update:modelValue', false)">
          {{ t('button.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="submitting" @click="submit">
          {{ t('password.change.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
