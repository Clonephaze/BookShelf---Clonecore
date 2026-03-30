<template>
  <div class="auth-form">
    <h2 class="auth-form__heading">Reset your password</h2>
    <p class="auth-form__subtext">Enter your email and we'll send you a reset link.</p>

    <form v-if="!sent" class="auth-form__form" @submit.prevent="handleSubmit">
      <FormField
        id="email"
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
        :error="errors.email"
      />

      <p v-if="errors.general" class="auth-form__error" role="alert">
        {{ errors.general }}
      </p>

      <button type="submit" class="auth-form__submit" :disabled="loading">
        {{ loading ? 'Sending…' : 'Send Reset Link' }}
      </button>
    </form>

    <div v-else class="auth-form__success" role="status">
      <p>If an account exists for <strong>{{ form.email }}</strong>, you'll receive a password reset link shortly.</p>

      <div v-if="devResetUrl" class="auth-form__dev-tools">
        <span class="auth-form__dev-label">DEV</span>
        <a :href="devResetUrl" class="auth-form__dev-link">Open reset link</a>
      </div>
    </div>

    <p class="auth-form__footer">
      <NuxtLink to="/login">Back to sign in</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { requestPasswordReset } = useAuth()
const config = useRuntimeConfig()
const isDevMode = config.public.devMode

const form = reactive({
  email: '',
})

const errors = reactive({
  email: '',
  general: '',
})

const loading = ref(false)
const sent = ref(false)
const devResetUrl = ref<string | null>(null)

function validate(): boolean {
  errors.email = ''
  errors.general = ''

  if (!form.email.trim()) {
    errors.email = 'Email is required'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    await requestPasswordReset({
      email: form.email.trim(),
      redirectTo: '/reset-password',
    })

    // Always show success to prevent email enumeration
    sent.value = true

    // In dev mode, fetch the reset link from the server
    if (isDevMode) {
      const { resetUrl } = await $fetch<{ resetUrl: string | null }>('/api/dev/reset-link')
      devResetUrl.value = resetUrl
    }
  }
  catch {
    errors.general = 'Something went wrong. Please try again.'
  }
  finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.auth-form {
  &__heading {
    @include heading($font-size-xl);
    margin-bottom: $spacing-xs;
  }

  &__subtext {
    @include body-text;
    margin-bottom: $spacing-xl;
  }

  &__form {
    @include flex-column;
    gap: $spacing-md;
  }

  &__error {
    font-size: $font-size-sm;
    color: var(--error-color);
    padding: $spacing-sm $spacing-md;
    background: rgba(192, 57, 43, 0.08);
    border-radius: $radius-md;
  }

  &__success {
    @include body-text;
    padding: $spacing-md;
    background: rgba(39, 174, 96, 0.08);
    border-radius: $radius-md;
    line-height: 1.6;
  }

  &__dev-tools {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: rgba(255, 165, 0, 0.1);
    border: 1px dashed rgba(255, 165, 0, 0.5);
    border-radius: $radius-md;
  }

  &__dev-label {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #e67e22;
    background: rgba(255, 165, 0, 0.15);
    padding: 2px 6px;
    border-radius: $radius-sm;
  }

  &__dev-link {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: #e67e22;

    &:hover {
      color: #d35400;
      text-decoration: underline;
    }
  }

  &__submit {
    @include button-primary;
    width: 100%;
    margin-top: $spacing-sm;
  }

  &__footer {
    @include meta-text;
    margin-top: $spacing-lg;
    text-align: center;

    a {
      color: var(--highlight-color);
      font-weight: $font-weight-semibold;

      &:hover {
        color: var(--highlight-color-hover);
      }
    }
  }
}
</style>
