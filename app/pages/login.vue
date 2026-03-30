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
        {{ loading ? 'Signing in…' : 'Sign In' }}
      </button>

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

const { signIn } = useAuth()

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
  if (!validate()) return

  loading.value = true
  errors.general = ''

  try {
    const { error } = await signIn({
      email: form.email.trim(),
      password: form.password,
    })

    if (error) {
      errors.general = 'Invalid email or password.'
      return
    }

    await navigateTo('/library')
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

  &__submit {
    @include button-primary;
    width: 100%;
    margin-top: $spacing-sm;
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
