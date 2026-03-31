<template>
  <div class="auth-form">
    <h2 class="auth-form__heading">Welcome back</h2>
    <p class="auth-form__subtext">Sign in to your Bookshelf account.</p>

    <form class="auth-form__form" @submit.prevent="handleSignIn">
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
      <FormField
        id="password"
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="Your password"
        autocomplete="current-password"
        required
        :error="errors.password"
      />

      <p v-if="errors.general" class="auth-form__error" role="alert">
        {{ errors.general }}
      </p>

      <button type="submit" class="auth-form__submit" :disabled="loading">
        <span v-if="loading" class="auth-form__spinner" aria-hidden="true" />
        {{ loading ? 'Signing in…' : 'Sign In' }}
      </button>

      <p v-if="slow" class="auth-form__slow" role="status">
        This is taking longer than usual. Hang tight…
      </p>

      <NuxtLink to="/forgot-password" class="auth-form__forgot">Forgot your password?</NuxtLink>
    </form>

    <p class="auth-form__footer">
      Don't have an account?
      <NuxtLink to="/signup">Sign up</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { signIn, waitForSession } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
  general: '',
})

const loading = ref(false)
const slow = ref(false)

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  errors.general = ''

  let valid = true

  if (!form.email.trim()) {
    errors.email = 'Email is required'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  }

  return valid
}

async function handleSignIn() {
  if (!validate() || loading.value) return

  loading.value = true
  slow.value = false
  errors.general = ''

  const slowTimer = setTimeout(() => { slow.value = true }, 4000)

  try {
    const { error } = await signIn({
      email: form.email.trim(),
      password: form.password,
    })

    if (error) {
      errors.general = 'Invalid email or password.'
      return
    }

    // Wait for session to propagate before navigating
    const ready = await waitForSession()
    if (ready) {
      await navigateTo('/library', { replace: true })
    } else {
      // Session didn't propagate in time — force a full navigation
      window.location.href = '/library'
    }
  }
  catch {
    errors.general = 'Something went wrong. Please try again.'
  }
  finally {
    clearTimeout(slowTimer)
    loading.value = false
    slow.value = false
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

  &__submit {
    @include button-primary;
    width: 100%;
    margin-top: $spacing-sm;
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: auth-spin 0.6s linear infinite;
  }

  @keyframes auth-spin {
    to { transform: rotate(360deg); }
  }

  &__slow {
    @include meta-text;
    text-align: center;
    color: var(--text-color-muted);
    animation: auth-fade-in 0.3s ease;
  }

  @keyframes auth-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  &__forgot {
    @include meta-text;
    display: block;
    text-align: right;
    color: var(--highlight-color);

    &:hover {
      color: var(--highlight-color-hover);
    }
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
