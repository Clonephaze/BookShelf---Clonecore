<template>
  <div class="auth-form">
    <h2 class="auth-form__heading">Set a new password</h2>
    <p class="auth-form__subtext">Enter your new password below.</p>

    <div v-if="!token" class="auth-form__error" role="alert">
      <p>Invalid or missing reset token. Please request a new reset link.</p>
      <p class="auth-form__footer">
        <NuxtLink to="/forgot-password">Request new link</NuxtLink>
      </p>
    </div>

    <form v-else-if="!success" class="auth-form__form" @submit.prevent="handleReset">
      <FormField
        id="password"
        v-model="form.password"
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        autocomplete="new-password"
        required
        :error="errors.password"
      />
      <FormField
        id="confirmPassword"
        v-model="form.confirmPassword"
        label="Confirm password"
        type="password"
        placeholder="Re-enter your password"
        autocomplete="new-password"
        required
        :error="errors.confirmPassword"
      />

      <p v-if="errors.general" class="auth-form__error" role="alert">
        {{ errors.general }}
      </p>

      <button type="submit" class="auth-form__submit" :disabled="loading">
        {{ loading ? 'Resetting…' : 'Reset Password' }}
      </button>
    </form>

    <div v-else class="auth-form__success" role="status">
      <p>Password updated — signing you in…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { resetPassword, signIn, waitForSession } = useAuth()
const route = useRoute()

const token = computed(() => route.query.token as string | undefined)
const email = computed(() => route.query.email as string | undefined)

const form = reactive({
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  password: '',
  confirmPassword: '',
  general: '',
})

const loading = ref(false)
const success = ref(false)

function validate(): boolean {
  errors.password = ''
  errors.confirmPassword = ''
  errors.general = ''

  let valid = true

  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  }
  else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    valid = false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    valid = false
  }

  return valid
}

async function handleReset() {
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    const { error } = await resetPassword({
      newPassword: form.password,
      token: token.value,
    })

    if (error) {
      errors.general = 'Reset failed. The link may have expired — please request a new one.'
      return
    }

    success.value = true

    // Auto-sign-in if we have the email from the reset link
    if (email.value) {
      try {
        await signIn({ email: email.value, password: form.password })
        const ready = await waitForSession()
        if (ready) {
          await navigateTo('/library', { replace: true })
        } else {
          window.location.href = '/library'
        }
        return
      }
      catch {
        // Sign-in failed — still show success, user can sign in manually
      }
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
