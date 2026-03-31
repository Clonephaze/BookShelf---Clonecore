<template>
  <div class="settings">
    <h2 class="settings__title">Settings</h2>

    <nav class="settings__nav" aria-label="Settings sections">
      <button
        v-for="section in sections"
        :key="section.id"
        class="settings__nav-item"
        :class="{
          'settings__nav-item--active': activeSection === section.id,
          'settings__nav-item--danger': section.id === 'danger',
        }"
        @click="activeSection = section.id"
      >
        <component :is="section.icon" :size="18" />
        <span>{{ section.label }}</span>
      </button>
    </nav>

    <div class="settings__content">
      <!-- Appearance -->
      <section v-if="activeSection === 'appearance'" class="settings__panel">
        <h3 class="settings__panel-title">Appearance</h3>
        <p class="settings__panel-desc">Customize how Bookshelf looks and feels.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Theme</h4>
          <div class="settings__theme-options">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              class="settings__theme-btn"
              :class="{ 'settings__theme-btn--active': currentTheme === option.value }"
              @click="setTheme(option.value)"
            >
              <component :is="option.icon" :size="18" />
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Reading comfort</h4>
          <p class="settings__group-hint">Font size and display density settings coming soon.</p>
        </div>
      </section>

      <!-- Account -->
      <section v-if="activeSection === 'account'" class="settings__panel">
        <h3 class="settings__panel-title">Account</h3>
        <p class="settings__panel-desc">Your profile and login information.</p>

        <div v-if="user" class="settings__group">
          <h4 class="settings__group-label">Profile</h4>
          <div class="settings__info-grid">
            <div class="settings__info-item">
              <span class="settings__info-label">Name</span>
              <span class="settings__info-value">{{ user.name }}</span>
            </div>
            <div class="settings__info-item">
              <span class="settings__info-label">Email</span>
              <span class="settings__info-value">{{ user.email }}</span>
            </div>
            <div class="settings__info-item">
              <span class="settings__info-label">Member since</span>
              <span class="settings__info-value">{{ memberSince }}</span>
            </div>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Legal</h4>
          <NuxtLink to="/privacy" class="settings__link">Privacy Policy &rarr;</NuxtLink>
        </div>

        <div v-if="user" class="settings__group">
          <h4 class="settings__group-label">Change password</h4>
          <form class="settings__form" @submit.prevent="handleChangePassword">
            <FormField
              id="currentPassword"
              v-model="passwordForm.current"
              label="Current Password"
              type="password"
              autocomplete="current-password"
              required
              :error="passwordErrors.current"
            />
            <FormField
              id="newPassword"
              v-model="passwordForm.next"
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              autocomplete="new-password"
              required
              :error="passwordErrors.next"
            />
            <FormField
              id="confirmNewPassword"
              v-model="passwordForm.confirm"
              label="Confirm New Password"
              type="password"
              autocomplete="new-password"
              required
              :error="passwordErrors.confirm"
            />
            <p v-if="passwordErrors.general" class="settings__error" role="alert">
              {{ passwordErrors.general }}
            </p>
            <p v-if="passwordSuccess" class="settings__success" role="status">
              Password updated successfully.
            </p>
            <button type="submit" class="settings__btn settings__btn--primary" :disabled="passwordLoading">
              {{ passwordLoading ? 'Updating…' : 'Update Password' }}
            </button>
          </form>
        </div>
      </section>

      <!-- Reading Preferences -->
      <section v-if="activeSection === 'reading'" class="settings__panel">
        <h3 class="settings__panel-title">Reading Preferences</h3>
        <p class="settings__panel-desc">Customize your reading experience and defaults.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Default shelf</h4>
          <p class="settings__group-hint">When adding a book, it will be placed on this shelf by default.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming with Book Search</p>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Reading goal</h4>
          <p class="settings__group-hint">Set a yearly reading target and track your progress.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming with Goals</p>
        </div>
      </section>

      <!-- Notifications -->
      <section v-if="activeSection === 'notifications'" class="settings__panel">
        <h3 class="settings__panel-title">Notifications</h3>
        <p class="settings__panel-desc">Control when and how you hear from Bookshelf.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Email notifications</h4>
          <p class="settings__group-hint">Reading reminders, goal milestones, and weekly digests.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming soon</p>
        </div>
      </section>

      <!-- Privacy & Sharing -->
      <section v-if="activeSection === 'privacy'" class="settings__panel">
        <h3 class="settings__panel-title">Privacy &amp; Sharing</h3>
        <p class="settings__panel-desc">Control who can see your reading activity.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Profile visibility</h4>
          <p class="settings__group-hint">Choose whether your profile and reading activity are public or private.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming with Social Sharing</p>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Sharing defaults</h4>
          <p class="settings__group-hint">Default privacy for reading cards and year-in-review.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming with Social Sharing</p>
        </div>
      </section>

      <!-- Data -->
      <section v-if="activeSection === 'data'" class="settings__panel">
        <h3 class="settings__panel-title">Data</h3>
        <p class="settings__panel-desc">Import, export, and manage your reading data.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Import from Goodreads</h4>
          <p class="settings__group-hint">Upload a Goodreads CSV export to migrate your library, ratings, and reading history.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming with Goodreads Migration</p>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Export your data</h4>
          <p class="settings__group-hint">Download your entire Bookshelf library as JSON or CSV.</p>
          <p class="settings__group-hint settings__group-hint--coming">Coming soon</p>
        </div>
      </section>

      <!-- Danger Zone -->
      <section v-if="activeSection === 'danger'" class="settings__panel settings__panel--danger">
        <h3 class="settings__panel-title settings__panel-title--danger">Danger Zone</h3>
        <p class="settings__panel-desc">Irreversible actions. Proceed with caution.</p>

        <div v-if="user" class="settings__group">
          <h4 class="settings__group-label settings__group-label--danger">Delete account</h4>
          <p class="settings__group-hint">
            Permanently delete your account and all associated data — shelves, books, reading progress, notes, and statistics. This cannot be undone.
          </p>

          <button
            v-if="!showDeleteConfirm"
            class="settings__btn settings__btn--danger-outline"
            @click="showDeleteConfirm = true"
          >
            Delete Account
          </button>

          <form v-else class="settings__form" @submit.prevent="handleDeleteAccount">
            <p class="settings__delete-warning">
              Enter your password to confirm permanent deletion.
            </p>
            <FormField
              id="deletePassword"
              v-model="deletePassword"
              label="Confirm your password"
              type="password"
              autocomplete="off"
              required
              :error="deleteError"
            />
            <div class="settings__form-actions">
              <button type="submit" class="settings__btn settings__btn--danger" :disabled="deleteLoading">
                {{ deleteLoading ? 'Deleting…' : 'Permanently Delete Account' }}
              </button>
              <button type="button" class="settings__btn settings__btn--ghost" @click="cancelDelete">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Monitor, Sun, Moon, BookOpen, Contrast,
  Palette, UserCircle, BookMarked, Bell, Shield, Database, AlertTriangle,
} from 'lucide-vue-next'
import type { Theme } from '~/composables/useTheme'

definePageMeta({ layout: 'default' })

useHead({ title: 'Settings — Bookshelf' })

const { user, changePassword, deleteUser, signOut } = useAuth()
const { currentTheme, setTheme } = useTheme()

const activeSection = ref('appearance')

const sections = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account', label: 'Account', icon: UserCircle },
  { id: 'reading', label: 'Reading', icon: BookMarked },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Sharing', icon: Shield },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'sepia', label: 'Sepia', icon: BookOpen },
  { value: 'contrast', label: 'High Contrast', icon: Contrast },
]

const memberSince = computed(() => {
  if (!user.value?.createdAt) return '—'
  return new Date(user.value.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

// Change password
const passwordForm = reactive({ current: '', next: '', confirm: '' })
const passwordErrors = reactive({ current: '', next: '', confirm: '', general: '' })
const passwordLoading = ref(false)
const passwordSuccess = ref(false)

function validatePassword(): boolean {
  passwordErrors.current = ''
  passwordErrors.next = ''
  passwordErrors.confirm = ''
  passwordErrors.general = ''
  let valid = true

  if (!passwordForm.current) {
    passwordErrors.current = 'Current password is required'
    valid = false
  }
  if (passwordForm.next.length < 8) {
    passwordErrors.next = 'Password must be at least 8 characters'
    valid = false
  }
  if (passwordForm.confirm !== passwordForm.next) {
    passwordErrors.confirm = 'Passwords do not match'
    valid = false
  }
  return valid
}

async function handleChangePassword() {
  if (!validatePassword()) return
  passwordLoading.value = true
  passwordSuccess.value = false

  try {
    const { error } = await changePassword({
      currentPassword: passwordForm.current,
      newPassword: passwordForm.next,
      revokeOtherSessions: false,
    })

    if (error) {
      passwordErrors.general = error.message || 'Could not update password. Please try again.'
      return
    }

    passwordSuccess.value = true
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
  }
  catch {
    passwordErrors.general = 'Something went wrong. Please try again.'
  }
  finally {
    passwordLoading.value = false
  }
}

// Delete account
const showDeleteConfirm = ref(false)
const deletePassword = ref('')
const deleteError = ref('')
const deleteLoading = ref(false)

function cancelDelete() {
  showDeleteConfirm.value = false
  deletePassword.value = ''
  deleteError.value = ''
}

async function handleDeleteAccount() {
  deleteError.value = ''
  if (!deletePassword.value) {
    deleteError.value = 'Password is required'
    return
  }

  deleteLoading.value = true
  try {
    const { error } = await deleteUser({ password: deletePassword.value })

    if (error) {
      deleteError.value = error.message || 'Could not delete account. Check your password.'
      return
    }

    await signOut()
    await navigateTo('/', { replace: true })
  }
  catch {
    deleteError.value = 'Something went wrong. Please try again.'
  }
  finally {
    deleteLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.settings {
  @include container($page-max-width);
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  gap: $spacing-lg;
  min-height: 70vh;

  @include respond-to($breakpoint-md) {
    grid-template-columns: 220px 1fr;
    grid-template-rows: auto 1fr;
    gap: $spacing-xl;
  }

  // Title
  &__title {
    @include heading($font-size-2xl);
    grid-column: 1 / -1;
  }

  // Nav
  &__nav {
    display: flex;
    gap: $spacing-xs;
    overflow-x: auto;
    padding-bottom: $spacing-xs;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;

    @include respond-to($breakpoint-md) {
      flex-direction: column;
      overflow-x: visible;
      padding-bottom: 0;
      position: sticky;
      top: $spacing-xl;
      align-self: start;
    }
  }

  &__nav-item {
    @include body-text;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-md;
    border-radius: $radius-md;
    border: none;
    background: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    white-space: nowrap;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: all 0.15s;

    &:hover {
      color: var(--text-color);
      background: var(--sub-bg-color);
    }

    &--active {
      color: var(--highlight-color);
      background: var(--highlight-color-subtle);
    }

    &--danger {
      color: var(--error-color, #c0392b);

      &.settings__nav-item--active {
        background: rgba(192, 57, 43, 0.08);
      }
    }
  }

  // Content panels
  &__content {
    min-width: 0;
  }

  &__panel {
    @include flex-column;
    gap: $spacing-xl;

    &--danger {
      border-top: 2px solid var(--error-color, #c0392b);
      padding-top: $spacing-lg;
    }
  }

  &__panel-title {
    @include heading($font-size-xl);
    margin-bottom: -$spacing-sm;

    &--danger {
      color: var(--error-color, #c0392b);
    }
  }

  &__panel-desc {
    @include body-text;
    color: var(--text-color-muted);
    margin-bottom: $spacing-sm;
  }

  // Groups
  &__group {
    @include flex-column;
    gap: $spacing-sm;
    padding: $spacing-lg;
    background: var(--surface-color);
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-lg;
  }

  &__group-label {
    @include heading($font-size-base);
    font-weight: $font-weight-semibold;
    color: var(--text-color);

    &--danger {
      color: var(--error-color, #c0392b);
    }
  }

  &__group-hint {
    @include meta-text;
    line-height: 1.5;

    &--coming {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: $font-weight-semibold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--highlight-color);
      padding: 2px $spacing-xs;
      background: var(--highlight-color-subtle);
      border-radius: $radius-sm;
      margin-top: $spacing-xs;
    }
  }

  // Links
  &__link {
    @include body-text;
    color: var(--highlight-color);
    font-weight: $font-weight-medium;
    font-size: $font-size-sm;

    &:hover {
      color: var(--highlight-color-hover);
    }
  }

  // Info grid (account)
  &__info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: $spacing-md;
    margin-top: $spacing-xs;

    @include respond-to($breakpoint-sm) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__info-item {
    @include flex-column;
    gap: 2px;
  }

  &__info-label {
    @include meta-text;
    font-weight: $font-weight-medium;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-size: 0.7rem;
  }

  &__info-value {
    @include body-text;
    color: var(--text-color);
    font-weight: $font-weight-medium;
  }

  // Theme buttons
  &__theme-options {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  &__theme-btn {
    @include button-tertiary;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    font-size: $font-size-sm;

    &--active {
      border-color: var(--highlight-color);
      color: var(--highlight-color);
      background-color: var(--highlight-color-subtle);
    }
  }

  // Forms
  &__form {
    @include flex-column;
    gap: $spacing-md;
    max-width: 400px;
    margin-top: $spacing-xs;
  }

  &__form-actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }

  &__error {
    @include body-text;
    color: var(--error-color, #c0392b);
    font-size: $font-size-sm;
  }

  &__success {
    @include body-text;
    color: var(--success-color, #3d7c4f);
    font-size: $font-size-sm;
  }

  // Buttons
  &__btn {
    &--primary {
      @include button-primary;
      align-self: flex-start;
    }

    &--danger-outline {
      @include body-text;
      background: transparent;
      color: var(--error-color, #c0392b);
      border: 1px solid var(--error-color, #c0392b);
      padding: $spacing-sm $spacing-lg;
      border-radius: $radius-md;
      cursor: pointer;
      font-weight: $font-weight-medium;
      transition: background-color 0.15s, color 0.15s;

      &:hover {
        background: var(--error-color, #c0392b);
        color: #fff;
      }
    }

    &--danger {
      @include body-text;
      background: var(--error-color, #c0392b);
      color: #fff;
      border: none;
      padding: $spacing-sm $spacing-lg;
      border-radius: $radius-md;
      cursor: pointer;
      font-weight: $font-weight-medium;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    &--ghost {
      @include button-tertiary;
      padding: $spacing-sm $spacing-md;
    }
  }

  // Delete-specific
  &__delete-warning {
    @include body-text;
    color: var(--error-color, #c0392b);
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }
}
</style>
