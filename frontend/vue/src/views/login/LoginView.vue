<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { login as loginApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { isSafeInternalPath } from '@/lib/path'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: 'super', password: 'super' })
const errors = ref<{ username?: string; password?: string; form?: string }>({})
const submitting = ref(false)
const showPassword = ref(false)

const redirectTo = computed(() => {
  const queryRedirect = route.query.redirect
  return isSafeInternalPath(queryRedirect) ? queryRedirect : '/'
})

function validate(): boolean {
  const next: typeof errors.value = {}
  if (form.value.username.trim().length < 4) next.username = t('page.login.username.valid')
  if (form.value.password.length < 4) next.password = t('page.login.password.valid')
  errors.value = next
  return Object.keys(next).length === 0
}

function errorMessage(error: unknown): string {
  const source = error as {
    message?: string
    response?: { data?: { message?: string } }
    data?: { message?: string }
  }
  return (
    source?.response?.data?.message || source?.data?.message || source?.message || t('page.login.failed')
  )
}

async function submit() {
  if (submitting.value || !validate()) return
  submitting.value = true
  errors.value = {}
  try {
    const data = await loginApi({
      username: form.value.username.trim(),
      password: form.value.password,
    })
    if (data?.status === 'ok' && data.token) {
      auth.login(data.token, data.expiresIn)
      await router.replace(redirectTo.value)
      return
    }
    errors.value = { form: data?.msg || t('page.login.failed') }
  } catch (error) {
    errors.value = { form: errorMessage(error) }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-topbar">
      <LocaleSwitcher />
      <ThemeToggle />
    </div>

    <div class="login-shell">
      <section class="login-hero">
        <div class="hero-brand">
          <span class="hero-mark">O</span>
          <span>ORANGE</span>
        </div>
        <h1>{{ t('page.login.hero.title') }}</h1>
        <p class="hero-desc">{{ t('page.login.hero.desc') }}</p>
        <div class="hero-stats">
          <div><strong>31+</strong><span>{{ t('page.login.hero.pages') }}</span></div>
          <div><strong>2</strong><span>{{ t('page.login.hero.languages') }}</span></div>
          <div><strong>RBAC</strong><span>{{ t('page.login.hero.rbac') }}</span></div>
        </div>
      </section>

      <v-card class="login-card">
        <v-card-title class="text-h5 font-weight-bold">{{ t('page.login.title') }}</v-card-title>
        <v-card-subtitle class="pb-4">{{ t('page.login.desc') }}</v-card-subtitle>
        <v-card-text>
          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="form.username"
              :label="t('page.login.username')"
              prepend-inner-icon="mdi-account-outline"
              :error-messages="errors.username"
              autocomplete="username"
              autofocus
              required
            />
            <v-text-field
              v-model="form.password"
              :label="t('page.login.password')"
              prepend-inner-icon="mdi-lock-outline"
              :type="showPassword ? 'text' : 'password'"
              :error-messages="errors.password"
              autocomplete="current-password"
              required
            >
              <template #append-inner>
                <v-icon
                  :aria-label="
                    showPassword
                      ? t('page.login.hidePassword')
                      : t('page.login.showPassword')
                  "
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                </v-icon>
              </template>
            </v-text-field>
            <v-alert v-if="errors.form" type="error" variant="tonal" density="compact" class="mt-3">
              {{ errors.form }}
            </v-alert>
            <v-btn
              type="submit"
              color="primary"
              size="large"
              block
              class="mt-5"
              :loading="submitting"
            >
              {{ t('page.login.login') }}
            </v-btn>
          </v-form>
          <p class="demo-hint">{{ t('page.login.demoHint') }}</p>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 12% 18%,
      color-mix(in srgb, rgb(var(--v-theme-primary)) 22%, transparent),
      transparent 42%
    ),
    radial-gradient(
      circle at 88% 82%,
      color-mix(in srgb, rgb(var(--v-theme-primary)) 16%, transparent),
      transparent 46%
    ),
    rgb(var(--v-theme-background));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  position: relative;
}

.login-topbar {
  position: absolute;
  top: 12px;
  right: 16px;
  display: flex;
  gap: 4px;
}

.login-shell {
  width: 100%;
  max-width: 1040px;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 40px;
  align-items: center;
}

.login-hero h1 {
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 20px 0 16px;
}

.login-hero p {
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.7;
  max-width: 460px;
}

.hero-desc {
  white-space: pre-line;
}

.hero-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.hero-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--orange-radius);
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-on-primary));
  background: linear-gradient(135deg, #fb923c, rgb(var(--v-theme-primary)));
}

.hero-stats {
  display: flex;
  gap: 36px;
  margin-top: 36px;
}

.hero-stats div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-stats strong {
  font-size: 22px;
}

.hero-stats span {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-card {
  border-radius: var(--orange-radius);
}

.demo-hint {
  margin-top: 16px;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
    max-width: 440px;
  }

  .login-hero {
    display: none;
  }
}
</style>
