<template>
  <div class="auth-form">
    <h2 class="auth-form__heading">Create your account</h2>
    <p class="auth-form__subtext">Start tracking your reading journey.</p>

    <form class="auth-form__form" @submit.prevent="handleSignUp">
      <FormField
        id="name"
        v-model="form.name"
        label="Name"
        placeholder="Your name"
        autocomplete="name"
        required
        :error="errors.name"
      />
      <div class="auth-form__field-group">
        <FormField
          id="username"
          v-model="form.username"
          label="Username (optional)"
          placeholder="e.g. bookworm42"
          autocomplete="username"
          :error="errors.username"
        />
        <p class="auth-form__hint">3–20 characters: lowercase letters, numbers, underscores, hyphens.</p>
      </div>
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
        placeholder="At least 8 characters"
        autocomplete="new-password"
        required
        :error="errors.password"
      />
      <FormField
        id="confirmPassword"
        v-model="form.confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Repeat your password"
        autocomplete="new-password"
        required
        :error="errors.confirmPassword"
      />

      <div class="auth-form__avatar-section">
        <label class="auth-form__label">Profile picture <span class="auth-form__optional">(optional)</span></label>
        <div class="auth-form__avatar-grid">
          <button
            v-for="av in avatars"
            :key="av.id"
            type="button"
            class="auth-form__avatar-option"
            :class="{ 'auth-form__avatar-option--active': form.avatar === av.id }"
            :aria-label="av.label"
            :title="av.label"
            @click="form.avatar = form.avatar === av.id ? '' : av.id"
          >
            <img :src="av.src" :alt="av.label" width="36" height="36">
          </button>
        </div>
      </div>

      <p v-if="errors.general" class="auth-form__error" role="alert">
        {{ errors.general }}
      </p>

      <button type="submit" class="auth-form__submit" :disabled="loading">
        <span v-if="loading" class="auth-form__spinner" aria-hidden="true" />
        {{ loading ? 'Creating account…' : 'Sign Up' }}
      </button>

      <p v-if="slow" class="auth-form__slow" role="status">
        This is taking longer than usual. Hang tight…
      </p>
    </form>

    <p class="auth-form__footer">
      Already have an account?
      <NuxtLink to="/login">Sign in</NuxtLink>
    </p>

    <p class="auth-form__legal">
      By signing up, you agree to our <NuxtLink to="/privacy">Privacy Policy</NuxtLink>.
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { signUp, waitForSession, updateProfile } = useAuth()

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatar: '',
})

const errors = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  general: '',
})

const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/

const loading = ref(false)
const slow = ref(false)

function validate(): boolean {
  errors.name = ''
  errors.username = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.general = ''

  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Name is required'
    valid = false
  }

  const username = form.username.trim().toLowerCase()
  if (username && !USERNAME_REGEX.test(username)) {
    errors.username = 'Must be 3–20 characters: lowercase letters, numbers, underscores, hyphens.'
    valid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required'
    valid = false
  }

  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    valid = false
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match'
    valid = false
  }

  return valid
}

async function handleSignUp() {
  if (!validate() || loading.value) return

  loading.value = true
  slow.value = false
  errors.general = ''

  const slowTimer = setTimeout(() => { slow.value = true }, 4000)

  try {
    const { error } = await signUp({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    if (error) {
      errors.general = error.message || 'Something went wrong. Please try again.'
      return
    }

    // Initialize default shelves for the new user
    await $fetch('/api/shelves/init', { method: 'POST' })

    // Set optional profile fields (username, avatar) after account creation
    // updateProfile also refetches the session so nav shows the new avatar
    const username = form.username.trim().toLowerCase()
    if (username || form.avatar) {
      try {
        await updateProfile({
          ...(username ? { username } : {}),
          ...(form.avatar ? { avatar: form.avatar } : {}),
        })
      }
      catch {
        // Non-critical — user can set these later in settings
      }
    }

    // Wait for session to propagate before navigating
    const ready = await waitForSession()
    if (ready) {
      await navigateTo('/library', { replace: true })
    } else {
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

  &__label {
    @include body-text;
    font-weight: $font-weight-medium;
    font-size: $font-size-sm;
    color: var(--text-color);
  }

  &__optional {
    font-weight: $font-weight-regular;
    color: var(--text-color-muted);
  }

  &__avatar-section {
    @include flex-column;
    gap: $spacing-sm;
  }

  &__avatar-grid {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__avatar-option {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--border-color-subtle);
    background: var(--surface-color);
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:hover {
      border-color: var(--highlight-color);
    }

    &--active {
      border-color: var(--highlight-color);
      box-shadow: 0 0 0 2px var(--highlight-color-subtle);
    }

    img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }
  }

  &__field-group {
    @include flex-column;
    gap: $spacing-xs;
  }

  &__hint {
    @include meta-text;
    color: var(--text-color-muted);
    line-height: 1.4;
  }

  &__legal {
    @include meta-text;
    margin-top: $spacing-sm;
    text-align: center;
    color: var(--text-color-muted);

    a {
      color: var(--highlight-color);

      &:hover {
        color: var(--highlight-color-hover);
      }
    }
  }
}
</style>
