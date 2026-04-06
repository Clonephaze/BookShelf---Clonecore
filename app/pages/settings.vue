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
          <div class="settings__theme-cards">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              class="settings__theme-card"
              :class="{ 'settings__theme-card--active': currentTheme === option.value }"
              :aria-pressed="currentTheme === option.value"
              @click="setTheme(option.value)"
            >
              <!-- System: split light/dark preview -->
              <div v-if="option.value === 'system'" class="settings__theme-preview settings__theme-preview--split">
                <div class="settings__theme-preview-half" :style="option.preview.light">
                  <div class="settings__theme-preview-bar" />
                  <div class="settings__theme-preview-line settings__theme-preview-line--long" />
                  <div class="settings__theme-preview-accent" />
                </div>
                <div class="settings__theme-preview-half" :style="option.preview.dark">
                  <div class="settings__theme-preview-bar" />
                  <div class="settings__theme-preview-line settings__theme-preview-line--long" />
                  <div class="settings__theme-preview-accent" />
                </div>
              </div>
              <!-- Normal single-theme preview -->
              <div v-else class="settings__theme-preview" :style="option.preview">
                <div class="settings__theme-preview-bar" />
                <div class="settings__theme-preview-lines">
                  <div class="settings__theme-preview-line settings__theme-preview-line--long" />
                  <div class="settings__theme-preview-line settings__theme-preview-line--short" />
                </div>
                <div class="settings__theme-preview-accent" />
              </div>
              <span class="settings__theme-card-label">{{ option.label }}</span>
            </button>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Accent color</h4>
          <p class="settings__group-hint">Choose the highlight color used for buttons, links, and focus states.</p>
          <div class="settings__accent-options">
            <button
              v-for="accent in accentOptions"
              :key="accent.value"
              class="settings__accent-swatch"
              :class="{ 'settings__accent-swatch--active': appearanceAccent === accent.value }"
              :style="{ '--swatch-color': accent.color }"
              :aria-label="accent.label"
              :aria-pressed="appearanceAccent === accent.value"
              @click="handleSetAccent(accent.value)"
            >
              <span class="settings__accent-dot" />
              <span class="settings__accent-label">{{ accent.label }}</span>
            </button>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Font</h4>
          <p class="settings__group-hint">Change the typeface used across the app.</p>
          <div class="settings__font-options">
            <button
              v-for="font in fontOptions"
              :key="font.value"
              class="settings__font-card"
              :class="{ 'settings__font-card--active': appearanceFont === font.value }"
              :aria-pressed="appearanceFont === font.value"
              @click="handleSetFont(font.value)"
            >
              <span class="settings__font-sample" :style="{ fontFamily: font.family }">Aa</span>
              <span class="settings__font-name">{{ font.label }}</span>
              <span class="settings__font-desc">{{ font.desc }}</span>
            </button>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Accessibility</h4>

          <div class="settings__sub-group">
            <span class="settings__sub-label">Font size</span>
            <div class="settings__segmented">
              <button
                v-for="opt in fontSizeOptions"
                :key="opt.value"
                class="settings__segmented-btn"
                :class="{ 'settings__segmented-btn--active': appearanceFontSize === opt.value }"
                :aria-pressed="appearanceFontSize === opt.value"
                @click="handleSetFontSize(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="settings__sub-group">
            <span class="settings__sub-label">Line height</span>
            <div class="settings__segmented">
              <button
                v-for="opt in lineHeightOptions"
                :key="opt.value"
                class="settings__segmented-btn"
                :class="{ 'settings__segmented-btn--active': appearanceLineHeight === opt.value }"
                :aria-pressed="appearanceLineHeight === opt.value"
                @click="handleSetLineHeight(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input
                type="checkbox"
                :checked="appearanceSimpleShelf"
                @change="handleSetSimpleShelf(($event.target as HTMLInputElement).checked)"
              >
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Simplified shelf view</span>
            </label>
          </div>
          <p class="settings__group-hint">Disables 3D book animations for a cleaner, flatter layout.</p>

          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input
                type="checkbox"
                :checked="appearanceHighContrast"
                @change="handleSetHighContrast(($event.target as HTMLInputElement).checked)"
              >
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">High contrast</span>
            </label>
          </div>
          <p class="settings__group-hint">Increases text and border contrast to meet WCAG AAA standards.</p>

          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input
                type="checkbox"
                :checked="appearanceColorBlind"
                @change="handleSetColorBlind(($event.target as HTMLInputElement).checked)"
              >
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Color-blind safe mode</span>
            </label>
          </div>
          <p class="settings__group-hint">Replaces red/green indicators with blue/orange for deuteranopia and protanopia.</p>
        </div>

        <p v-if="appearanceSaved" class="settings__save-note">Saved</p>
      </section>

      <!-- Account -->
      <section v-if="activeSection === 'account'" class="settings__panel">
        <h3 class="settings__panel-title">Account</h3>
        <p class="settings__panel-desc">Your profile and login information.</p>

        <div v-if="user" class="settings__group">
          <h4 class="settings__group-label">Profile picture</h4>
          <div class="settings__avatar-section">
            <UserAvatar :avatar-id="selectedAvatar" :name="user.name" size="lg" />
            <div class="settings__avatar-grid">
              <button
                v-for="av in avatars"
                :key="av.id"
                class="settings__avatar-option"
                :class="{ 'settings__avatar-option--active': selectedAvatar === av.id }"
                :aria-label="av.label"
                :title="av.label"
                @click="selectAvatar(av.id)"
              >
                <img :src="av.src" :alt="av.label" width="40" height="40">
              </button>
              <button
                class="settings__avatar-option"
                :class="{ 'settings__avatar-option--active': !selectedAvatar }"
                aria-label="Use initials"
                title="Use initials"
                @click="selectAvatar(null)"
              >
                <span class="settings__avatar-initials">{{ user.name?.charAt(0)?.toUpperCase() ?? '?' }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="user" class="settings__group">
          <h4 class="settings__group-label">Username</h4>
          <p class="settings__group-hint">3–20 characters: lowercase letters, numbers, underscores, hyphens.</p>
          <form class="settings__form" @submit.prevent="handleUpdateProfile">
            <FormField
              id="username"
              v-model="profileForm.username"
              label="Username"
              type="text"
              placeholder="e.g. bookworm42"
              autocomplete="username"
              :error="profileErrors.username"
            />
            <FormField
              id="displayName"
              v-model="profileForm.name"
              label="Display name"
              type="text"
              autocomplete="name"
              :error="profileErrors.name"
            />
            <p v-if="profileErrors.general" class="settings__error" role="alert">
              {{ profileErrors.general }}
            </p>
            <p v-if="profileSuccess" class="settings__success" role="status">
              Profile updated successfully.
            </p>
            <button type="submit" class="settings__btn settings__btn--primary" :disabled="profileLoading">
              {{ profileLoading ? 'Saving…' : 'Save Profile' }}
            </button>
          </form>
        </div>

        <div v-if="user" class="settings__group">
          <h4 class="settings__group-label">Account info</h4>
          <div class="settings__info-grid">
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
          <div v-if="shelvesLoading" class="settings__group-hint">Loading shelves…</div>
          <div v-else-if="availableShelves.length" class="settings__select-wrap">
            <select
              v-model="selectedShelfId"
              class="settings__select"
              @change="saveDefaultShelf"
            >
              <option :value="null">None (choose each time)</option>
              <option v-for="s in availableShelves" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <span v-if="shelfSaveSuccess" class="settings__inline-success">Saved</span>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Reading goals</h4>
          <p class="settings__group-hint">Set and manage yearly, monthly, and weekly targets.</p>
          <NuxtLink to="/goals" class="settings__link">Manage reading goals &rarr;</NuxtLink>
        </div>
      </section>

      <!-- Notifications -->
      <section v-if="activeSection === 'notifications'" class="settings__panel">
        <h3 class="settings__panel-title">Notifications</h3>
        <p class="settings__panel-desc">Control when and how you hear from Bookshelf.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Email notifications</h4>
          <p class="settings__group-hint">Reading reminders, goal milestones, and weekly digests.</p>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input type="checkbox" disabled>
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Weekly reading digest</span>
            </label>
            <span class="settings__badge">Coming soon</span>
          </div>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input type="checkbox" disabled>
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Goal milestone alerts</span>
            </label>
            <span class="settings__badge">Coming soon</span>
          </div>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input type="checkbox" disabled>
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Reading reminders</span>
            </label>
            <span class="settings__badge">Coming soon</span>
          </div>
        </div>
      </section>

      <!-- Privacy & Sharing -->
      <section v-if="activeSection === 'privacy'" class="settings__panel">
        <h3 class="settings__panel-title">Privacy &amp; Sharing</h3>
        <p class="settings__panel-desc">Control what friends can see on your profile.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Friends can see</h4>
          <p class="settings__group-hint">Toggle what's visible to friends who view your profile.</p>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input v-model="privacySettings.showShelves" type="checkbox" @change="savePrivacy">
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Shelves &amp; library</span>
            </label>
          </div>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input v-model="privacySettings.showProgress" type="checkbox" @change="savePrivacy">
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Reading progress</span>
            </label>
          </div>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input v-model="privacySettings.showRatings" type="checkbox" @change="savePrivacy">
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Ratings &amp; reviews</span>
            </label>
          </div>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input v-model="privacySettings.showGoals" type="checkbox" @change="savePrivacy">
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Reading goals</span>
            </label>
          </div>
          <div class="settings__toggle-row">
            <label class="settings__toggle">
              <input v-model="privacySettings.showActivity" type="checkbox" @change="savePrivacy">
              <span class="settings__toggle-slider" />
              <span class="settings__toggle-label">Activity feed</span>
            </label>
          </div>
          <p v-if="privacySaved" class="settings__save-note">Saved</p>
        </div>
      </section>

      <!-- Data -->
      <section v-if="activeSection === 'data'" class="settings__panel">
        <h3 class="settings__panel-title">Data</h3>
        <p class="settings__panel-desc">Import, export, and manage your reading data.</p>

        <div class="settings__group">
          <h4 class="settings__group-label">Import from Goodreads</h4>
          <p class="settings__group-hint">Upload a Goodreads CSV export to migrate your library, ratings, and reading history.</p>

          <!-- Step 1: Upload -->
          <div v-if="importStore.step === 'idle'" class="settings__import-upload">
            <label class="settings__import-dropzone" tabindex="0" @keydown.enter="($refs.csvInput as HTMLInputElement)?.click()">
              <input
                ref="csvInput"
                type="file"
                accept=".csv,text/csv"
                class="settings__import-file-input"
                @change="handleFileUpload"
              >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="settings__import-icon" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span class="settings__import-dropzone-text">Choose a CSV file or drag it here</span>
              <span class="settings__import-dropzone-hint">Goodreads → My Books → Export</span>
            </label>
            <p v-if="importStore.error" class="settings__error" role="alert">{{ importStore.error }}</p>
          </div>

          <!-- Step 2: Preview -->
          <div v-if="importStore.step === 'preview'" class="settings__import-preview">
            <div class="settings__import-stats">
              <div class="settings__import-stat">
                <span class="settings__import-stat-value">{{ importStore.preview?.totalParsed ?? 0 }}</span>
                <span class="settings__import-stat-label">Found</span>
              </div>
              <div class="settings__import-stat">
                <span class="settings__import-stat-value">{{ importStore.preview?.totalNew ?? 0 }}</span>
                <span class="settings__import-stat-label">New</span>
              </div>
              <div class="settings__import-stat">
                <span class="settings__import-stat-value">{{ importStore.preview?.totalExisting ?? 0 }}</span>
                <span class="settings__import-stat-label">Already in library</span>
              </div>
            </div>

            <ul v-if="importStore.preview?.issues?.length" class="settings__import-issues">
              <li v-for="(issue, idx) in importStore.preview.issues" :key="idx">{{ issue }}</li>
            </ul>

            <div class="settings__import-book-list">
              <div
                v-for="book in importStore.previewDisplay"
                :key="book.index"
                class="settings__import-book"
                :class="{ 'settings__import-book--existing': book.existsInLibrary }"
              >
                <div class="settings__import-book-info">
                  <span class="settings__import-book-title">{{ book.title }}</span>
                  <span class="settings__import-book-author">{{ book.author }}</span>
                </div>
                <span class="settings__import-book-shelf">{{ shelfLabel(book.targetShelf) }}</span>
                <span v-if="book.existsInLibrary" class="settings__badge">Exists</span>
                <span v-if="book.rating" class="settings__import-book-rating">{{ '★'.repeat(book.rating) }}</span>
              </div>
              <p v-if="importStore.preview && importStore.preview.books.length > 20" class="settings__group-hint">
                Showing 20 of {{ importStore.preview.books.length }} books
              </p>
            </div>

            <div class="settings__import-actions">
              <button
                class="settings__btn settings__btn--primary"
                :disabled="importStore.loading"
                @click="importStore.executeImport()"
              >
                {{ importStore.loading ? 'Importing…' : `Import ${importStore.preview?.totalNew ?? 0} books` }}
              </button>
              <button class="settings__btn settings__btn--ghost" @click="importStore.reset()">Cancel</button>
            </div>
            <p v-if="importStore.error" class="settings__error" role="alert">{{ importStore.error }}</p>
          </div>

          <!-- Step 3: Importing progress -->
          <div v-if="importStore.step === 'importing'" class="settings__import-progress">
            <div class="settings__import-progress-bar">
              <div
                class="settings__import-progress-fill"
                :style="{ width: `${importStore.estimatedProgress}%` }"
              />
            </div>
            <div class="settings__import-progress-info">
              <span class="settings__import-progress-pct">{{ importStore.estimatedProgress }}%</span>
              <span class="settings__import-progress-msg">{{ importStore.progressMessage }}</span>
            </div>
            <p class="settings__group-hint">Enriching metadata from Open Library &amp; Google Books. This may take a moment for larger libraries…</p>
          </div>

          <!-- Step 4: Results -->
          <div v-if="importStore.step === 'done'" class="settings__import-done">
            <!-- Timeout / unknown outcome -->
            <div v-if="!importStore.result && importStore.error" class="settings__import-timeout">
              <p class="settings__error" role="alert">{{ importStore.error }}</p>
            </div>
            <!-- Normal result stats -->
            <div v-else-if="importStore.result" class="settings__import-dashboard">
              <div class="settings__import-summary">
                <span class="settings__import-summary-number">{{ importStore.result.imported }}</span>
                <span class="settings__import-summary-label">books imported successfully</span>
              </div>

              <div class="settings__import-stats">
                <div class="settings__import-stat settings__import-stat--success">
                  <span class="settings__import-stat-value">{{ importStore.result.imported }}</span>
                  <span class="settings__import-stat-label">Imported</span>
                </div>
                <div v-if="importStore.result.enriched" class="settings__import-stat">
                  <span class="settings__import-stat-value">{{ importStore.result.enriched }}</span>
                  <span class="settings__import-stat-label">Enriched via API</span>
                </div>
                <div v-if="importStore.result.skippedExisting" class="settings__import-stat">
                  <span class="settings__import-stat-value">{{ importStore.result.skippedExisting }}</span>
                  <span class="settings__import-stat-label">Already in library</span>
                </div>
                <div v-if="importStore.result.notMatched" class="settings__import-stat">
                  <span class="settings__import-stat-value">{{ importStore.result.notMatched }}</span>
                  <span class="settings__import-stat-label">Not matched (CSV only)</span>
                </div>
                <div v-if="importStore.result.skippedError" class="settings__import-stat settings__import-stat--error">
                  <span class="settings__import-stat-value">{{ importStore.result.skippedError }}</span>
                  <span class="settings__import-stat-label">Errors</span>
                </div>
              </div>

              <div v-if="importSuccessRate < 100" class="settings__import-rate">
                <div class="settings__import-rate-bar">
                  <div class="settings__import-rate-fill" :style="{ width: `${importSuccessRate}%` }" />
                </div>
                <span class="settings__import-rate-label">{{ importSuccessRate }}% success rate</span>
              </div>
            </div>
            <button class="settings__btn settings__btn--secondary" @click="importStore.reset()">Import another</button>
          </div>
        </div>

        <div class="settings__group">
          <h4 class="settings__group-label">Export your data</h4>
          <p class="settings__group-hint">Download your entire Bookshelf library including shelves, ratings, notes, and dates.</p>
          <div class="settings__export-actions">
            <button
              class="settings__btn settings__btn--secondary"
              :disabled="!!exportLoading"
              @click="handleExport('json')"
            >
              {{ exportLoading === 'json' ? 'Exporting…' : 'Download JSON' }}
            </button>
            <button
              class="settings__btn settings__btn--secondary"
              :disabled="!!exportLoading"
              @click="handleExport('csv')"
            >
              {{ exportLoading === 'csv' ? 'Exporting…' : 'Download CSV' }}
            </button>
          </div>
          <p v-if="exportError" class="settings__error" role="alert">{{ exportError }}</p>
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
  Palette, UserCircle, BookMarked, Bell, Shield, Database, AlertTriangle,
} from 'lucide-vue-next'
import type { Theme } from '~/composables/useTheme'
import type { FontFamily, AccentColor, FontSizeLevel, LineHeightLevel } from '~/composables/useAppearance'
import { useLibraryStore } from '~/stores/library'

definePageMeta({ layout: 'default' })

useHead({ title: 'Settings — Bookshelf' })

const { user, changePassword, deleteUser, signOut, updateProfile } = useAuth()
const { currentTheme, setTheme } = useTheme()
const {
  fontFamily: appearanceFont,
  accentColor: appearanceAccent,
  simpleShelfView: appearanceSimpleShelf,
  fontSize: appearanceFontSize,
  lineHeight: appearanceLineHeight,
  highContrast: appearanceHighContrast,
  colorBlindMode: appearanceColorBlind,
  setFont, setAccent, setSimpleShelfView,
  setFontSize, setLineHeight, setHighContrast, setColorBlindMode,
} = useAppearance()
const libraryStore = useLibraryStore()

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

// Sync active section with URL hash
const validIds = new Set(sections.map(s => s.id))

function readHash() {
  const hash = window.location.hash.slice(1)
  if (hash && validIds.has(hash)) {
    activeSection.value = hash
  }
}

watch(activeSection, (id) => {
  if (window.location.hash.slice(1) !== id) {
    window.history.replaceState(null, '', `#${id}`)
  }
})

onMounted(() => {
  readHash()
})

const themeOptions: { value: Theme; label: string; preview: Record<string, string> | { light: Record<string, string>; dark: Record<string, string> } }[] = [
  {
    value: 'system', label: 'System',
    preview: {
      light: { '--p-bg': '#f4ebdb', '--p-text': '#302318', '--p-accent': '#a0592a' },
      dark: { '--p-bg': '#141110', '--p-text': '#e8e1d8', '--p-accent': '#c8844a' },
    },
  },
  { value: 'light', label: 'Light', preview: { '--p-bg': '#f4ebdb', '--p-surface': '#ebe1cf', '--p-text': '#302318', '--p-accent': '#a0592a' } },
  { value: 'dark', label: 'Dark', preview: { '--p-bg': '#141110', '--p-surface': '#1b1816', '--p-text': '#e8e1d8', '--p-accent': '#c8844a' } },
  { value: 'oled', label: 'OLED', preview: { '--p-bg': '#000000', '--p-surface': '#0c0a09', '--p-text': '#f0ece6', '--p-accent': '#d4964a' } },
]

const accentOptions: { value: AccentColor; label: string; color: string }[] = [
  { value: 'copper', label: 'Copper', color: '#a0592a' },
  { value: 'teal', label: 'Teal', color: '#2a8f8f' },
  { value: 'plum', label: 'Plum', color: '#8b4a8b' },
  { value: 'slate', label: 'Slate', color: '#5a6f7a' },
  { value: 'forest', label: 'Forest', color: '#4a7c59' },
]

const fontOptions: { value: FontFamily; label: string; family: string; desc: string }[] = [
  { value: 'default', label: 'Default', family: "'Lora', Georgia, serif", desc: 'Lora headings + Inter body' },
  { value: 'sans', label: 'Sans-serif', family: "'Inter', system-ui, sans-serif", desc: 'Inter everywhere' },
  { value: 'atkinson', label: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible Next', sans-serif", desc: 'Designed for readability' },
]

const appearanceSaved = ref(false)

function saveAppearanceToServer() {
  appearanceSaved.value = false
  $fetch('/api/preferences', {
    method: 'PATCH',
    body: {
      fontFamily: appearanceFont.value,
      accentColor: appearanceAccent.value,
      simpleShelfView: appearanceSimpleShelf.value,
      fontSize: appearanceFontSize.value,
      lineHeight: appearanceLineHeight.value,
      highContrast: appearanceHighContrast.value,
      colorBlindMode: appearanceColorBlind.value,
    },
  }).then(() => {
    appearanceSaved.value = true
    setTimeout(() => { appearanceSaved.value = false }, 2000)
  }).catch(() => {})
}

function handleSetFont(font: FontFamily) {
  setFont(font)
  if (user.value) saveAppearanceToServer()
}

function handleSetAccent(accent: AccentColor) {
  setAccent(accent)
  if (user.value) saveAppearanceToServer()
}

function handleSetSimpleShelf(on: boolean) {
  setSimpleShelfView(on)
  if (user.value) saveAppearanceToServer()
}

function handleSetFontSize(size: FontSizeLevel) {
  setFontSize(size)
  if (user.value) saveAppearanceToServer()
}

function handleSetLineHeight(height: LineHeightLevel) {
  setLineHeight(height)
  if (user.value) saveAppearanceToServer()
}

function handleSetHighContrast(on: boolean) {
  setHighContrast(on)
  if (user.value) saveAppearanceToServer()
}

function handleSetColorBlind(on: boolean) {
  setColorBlindMode(on)
  if (user.value) saveAppearanceToServer()
}

const fontSizeOptions: { value: FontSizeLevel; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
  { value: 'x-large', label: 'Extra Large' },
]

const lineHeightOptions: { value: LineHeightLevel; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'spacious', label: 'Spacious' },
]

const memberSince = computed(() => {
  if (!user.value?.createdAt) return '—'
  return new Date(user.value.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
})

// Profile editing
const selectedAvatar = ref<string | null>(user.value?.image ?? null)
const profileForm = reactive({
  username: (user.value as Record<string, unknown>)?.username as string ?? '',
  name: user.value?.name ?? '',
})
const profileErrors = reactive({ username: '', name: '', general: '' })
const profileLoading = ref(false)
const profileSuccess = ref(false)

// Sync form when user data loads/changes
watch(user, (u) => {
  if (u) {
    selectedAvatar.value = (u as Record<string, unknown>).avatar as string ?? null
    profileForm.username = (u as Record<string, unknown>).username as string ?? ''
    profileForm.name = u.name ?? ''
  }
}, { immediate: true })

function selectAvatar(id: string | null) {
  selectedAvatar.value = id
  // Save avatar immediately
  updateProfile({ avatar: id }).catch(() => {})
}

async function handleUpdateProfile() {
  profileErrors.username = ''
  profileErrors.name = ''
  profileErrors.general = ''
  profileSuccess.value = false

  const username = profileForm.username.trim().toLowerCase()
  const name = profileForm.name.trim()

  if (username && !/^[a-z0-9_-]{3,20}$/.test(username)) {
    profileErrors.username = 'Must be 3–20 characters: lowercase letters, numbers, underscores, hyphens.'
    return
  }
  if (!name) {
    profileErrors.name = 'Display name is required.'
    return
  }

  profileLoading.value = true
  try {
    await updateProfile({
      username: username || null,
      name,
    })
    profileSuccess.value = true
  }
  catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message
      || (err as { statusMessage?: string })?.statusMessage
      || 'Could not update profile.'
    if (msg.toLowerCase().includes('username')) {
      profileErrors.username = msg
    }
    else {
      profileErrors.general = msg
    }
  }
  finally {
    profileLoading.value = false
  }
}

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

// --- Reading Preferences ---
const shelvesLoading = ref(false)
const selectedShelfId = ref<string | null>(null)
const shelfSaveSuccess = ref(false)

const availableShelves = computed(() =>
  libraryStore.data.map(s => ({ id: s.id, name: s.name })),
)

async function loadPreferences() {
  shelvesLoading.value = true
  try {
    await libraryStore.fetch()
    const prefs = await $fetch<{ defaultShelfId: string | null }>('/api/preferences')
    selectedShelfId.value = prefs.defaultShelfId
  }
  catch {
    // Graceful fallback
  }
  finally {
    shelvesLoading.value = false
  }
}

async function saveDefaultShelf() {
  shelfSaveSuccess.value = false
  try {
    await $fetch('/api/preferences', {
      method: 'PATCH',
      body: { defaultShelfId: selectedShelfId.value },
    })
    shelfSaveSuccess.value = true
    setTimeout(() => { shelfSaveSuccess.value = false }, 2000)
  }
  catch {
    // Silently fail — value stays in select
  }
}

// Load preferences when Reading tab is selected
watch(activeSection, (id) => {
  if (id === 'reading' && !libraryStore.loaded) {
    loadPreferences()
  }
  if (id === 'privacy') {
    loadPrivacy()
  }
}, { immediate: true })

// --- Privacy Settings ---
const privacySettings = reactive({
  showShelves: true,
  showProgress: true,
  showRatings: true,
  showGoals: true,
  showActivity: true,
})
const privacySaved = ref(false)
const privacyLoaded = ref(false)

async function loadPrivacy() {
  if (privacyLoaded.value) return
  try {
    const prefs = await $fetch<{
      showShelves: boolean
      showProgress: boolean
      showRatings: boolean
      showGoals: boolean
      showActivity: boolean
    }>('/api/preferences')
    privacySettings.showShelves = prefs.showShelves
    privacySettings.showProgress = prefs.showProgress
    privacySettings.showRatings = prefs.showRatings
    privacySettings.showGoals = prefs.showGoals
    privacySettings.showActivity = prefs.showActivity
    privacyLoaded.value = true
  }
  catch { /* graceful fallback */ }
}

async function savePrivacy() {
  privacySaved.value = false
  try {
    await $fetch('/api/preferences', {
      method: 'PATCH',
      body: { ...privacySettings },
    })
    privacySaved.value = true
    setTimeout(() => { privacySaved.value = false }, 2000)
  }
  catch { /* silent */ }
}

// --- Data Export ---
const exportLoading = ref<string | null>(null)
const exportError = ref('')

async function handleExport(format: 'json' | 'csv') {
  exportError.value = ''
  exportLoading.value = format
  try {
    const response = await $fetch.raw(`/api/export?format=${format}`)
    const blob = new Blob(
      [typeof response._data === 'string' ? response._data : JSON.stringify(response._data, null, 2)],
      { type: format === 'json' ? 'application/json' : 'text/csv' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookshelf-export.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  catch {
    exportError.value = 'Export failed. Please try again.'
  }
  finally {
    exportLoading.value = null
  }
}

// --- Goodreads Import ---
const importStore = useImportStore()

const importSuccessRate = computed(() => {
  const r = importStore.result
  if (!r) return 100
  const total = r.imported + r.skippedExisting + r.skippedError
  return total > 0 ? Math.round((r.imported / total) * 100) : 100
})

function shelfLabel(slug: string): string {
  const labels: Record<string, string> = {
    'want-to-read': 'Want to Read',
    'currently-reading': 'Currently Reading',
    'read': 'Read',
  }
  return labels[slug] ?? slug
}

async function handleFileUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await importStore.uploadCsv(file)
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

  // Avatar section
  &__avatar-section {
    display: flex;
    align-items: flex-start;
    gap: $spacing-lg;
    margin-top: $spacing-xs;
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
    width: 48px;
    height: 48px;
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
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  }

  &__avatar-initials {
    font-family: $font-family-heading;
    font-weight: $font-weight-bold;
    font-size: 1rem;
    color: var(--highlight-color);
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

  // Theme preview cards
  &__theme-cards {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  &__theme-card {
    position: relative;
    width: 120px;
    border: 2px solid var(--border-color);
    border-radius: $radius-md;
    cursor: pointer;
    overflow: hidden;
    background: none;
    transition: border-color 0.15s;

    &--active {
      border-color: var(--highlight-color);
    }
  }

  &__theme-preview {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: $spacing-sm;
    background: var(--p-bg);

    &--split {
      flex-direction: row;
      padding: 0;
      gap: 0;
      background: none;
    }

    &-half {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: $spacing-sm;
      background: var(--p-bg);
    }

    &-bar {
      height: 6px;
      border-radius: 3px;
      width: 60%;
      background: var(--p-text);
    }

    &-lines {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    &-line {
      height: 4px;
      border-radius: 2px;
      background: var(--p-text);
      opacity: 0.35;

      &--long { width: 85%; }
      &--short { width: 55%; }
    }

    &-accent {
      height: 6px;
      border-radius: 3px;
      width: 40%;
      margin-top: 2px;
      background: var(--p-accent);
    }
  }

  &__theme-card-label {
    display: block;
    text-align: center;
    padding: $spacing-xs;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    border-top: 1px solid var(--border-color);
  }

  // Accent colour swatches
  &__accent-options {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  &__accent-swatch {
    @include flex-center;
    flex-direction: column;
    gap: $spacing-xs;
    cursor: pointer;
    background: none;
    border: none;
    padding: $spacing-xs;
  }

  &__accent-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--swatch-color);
    border: 3px solid transparent;
    transition: border-color 0.15s, transform 0.15s;
  }

  &__accent-swatch--active &__accent-dot {
    border-color: var(--text-color);
    transform: scale(1.15);
  }

  &__accent-label {
    font-size: $font-size-xs;
    color: var(--text-muted);
  }

  // Font family cards
  &__font-options {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  &__font-card {
    flex: 1;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: $spacing-md;
    border: 2px solid var(--border-color);
    border-radius: $radius-md;
    cursor: pointer;
    background: none;
    color: var(--text-color);
    text-align: left;
    transition: border-color 0.15s;

    &--active {
      border-color: var(--highlight-color);
    }
  }

  &__font-sample {
    display: block;
    font-size: $font-size-xl;
    line-height: 1.2;
  }

  &__font-name {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-color);
  }

  &__font-desc {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-muted);
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

    &--secondary {
      @include button-secondary;
      align-self: flex-start;
    }
  }

  // Select
  &__select-wrap {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  &__select {
    @include body-text;
    font-size: $font-size-sm;
    padding: $spacing-sm $spacing-md;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    background: var(--surface-color);
    color: var(--text-color);
    cursor: pointer;
    min-width: 12rem;
    transition: border-color 0.15s ease;

    &:focus {
      outline: none;
      border-color: var(--highlight-color);
    }
  }

  &__inline-success {
    font-family: $font-family-body;
    font-size: $font-size-xs;
    color: var(--success-color);
    font-weight: $font-weight-medium;
    animation: settings-fade-in 0.2s ease;
  }

  @keyframes settings-fade-in {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  // Toggle rows
  &__toggle-row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm 0;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;

    input[type="checkbox"] {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }

    &:has(input:disabled) {
      cursor: not-allowed;
      opacity: 0.5;
    }

    input:checked + .settings__toggle-slider {
      background: var(--highlight-color);

      &::after {
        transform: translateX(1.25rem);
      }
    }
  }

  &__toggle-slider {
    display: inline-block;
    width: 2.5rem;
    height: 1.25rem;
    background: var(--border-color);
    border-radius: $radius-full;
    position: relative;
    transition: background 0.15s ease;
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: calc(1.25rem - 4px);
      height: calc(1.25rem - 4px);
      background: var(--surface-color);
      border-radius: 50%;
      transition: transform 0.15s ease;
    }
  }

  &__toggle-label {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    color: var(--text-color);
  }

  // Sub-group for segmented controls
  &__sub-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: $spacing-sm 0;
  }

  &__sub-label {
    font-family: $font-family-body;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color-secondary);
  }

  // Segmented button group
  &__segmented {
    display: flex;
    border: 1px solid var(--border-color);
    border-radius: $radius-md;
    overflow: hidden;
    width: fit-content;
  }

  &__segmented-btn {
    @include body-text;
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-md;
    border: none;
    background: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;

    &:not(:last-child) {
      border-right: 1px solid var(--border-color);
    }

    &:hover {
      background: var(--sub-bg-color);
      color: var(--text-color);
    }

    &--active {
      background: var(--highlight-color-subtle);
      color: var(--highlight-color);
      font-weight: $font-weight-semibold;
    }
  }

  &__save-note {
    font-size: $font-size-sm;
    color: var(--highlight-color);
    margin-top: $spacing-sm;
  }

  // Badge
  &__badge {
    display: inline-block;
    font-family: $font-family-body;
    font-size: 0.65rem;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--highlight-color);
    padding: 2px $spacing-xs;
    background: var(--highlight-color-subtle);
    border-radius: $radius-sm;
    white-space: nowrap;
  }

  // Export actions
  &__export-actions {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-xs;
  }

  // Import (Goodreads)
  &__import-file-input {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    opacity: 0;
  }

  &__import-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xl $spacing-lg;
    border: 2px dashed var(--border-color);
    border-radius: $radius-lg;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-align: center;

    &:hover,
    &:focus-within {
      border-color: var(--highlight-color);
      background: var(--highlight-color-subtle);
    }
  }

  &__import-icon {
    width: 2rem;
    height: 2rem;
    color: var(--text-color-muted);
  }

  &__import-dropzone-text {
    @include body-text;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-color);
  }

  &__import-dropzone-hint {
    @include meta-text;
    font-size: $font-size-xs;
  }

  &__import-stats {
    display: flex;
    gap: $spacing-lg;
    padding: $spacing-md 0;
  }

  &__import-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;

    &--success &-value {
      color: var(--success-color, #3d7c4f);
    }

    &--error &-value {
      color: var(--error-color, #c0392b);
    }
  }

  &__import-stat-value {
    @include heading($font-size-xl);
  }

  &__import-stat-label {
    @include meta-text;
    font-size: $font-size-xs;
  }

  &__import-issues {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    li {
      @include body-text;
      font-size: $font-size-sm;
      color: var(--text-color-muted);
      padding-left: $spacing-md;
      position: relative;

      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--highlight-color);
      }
    }
  }

  &__import-book-list {
    max-height: 20rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    border: 1px solid var(--border-color-subtle);
    border-radius: $radius-md;
    margin-top: $spacing-sm;
  }

  &__import-book {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: var(--surface-color);

    &--existing {
      opacity: 0.5;
    }
  }

  &__import-book-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__import-book-title {
    @include body-text;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__import-book-author {
    @include meta-text;
    font-size: $font-size-xs;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__import-book-shelf {
    @include meta-text;
    font-size: $font-size-xs;
    white-space: nowrap;
  }

  &__import-book-rating {
    font-size: $font-size-xs;
    color: var(--rating-color, var(--highlight-color));
    white-space: nowrap;
  }

  &__import-actions {
    display: flex;
    gap: $spacing-sm;
    margin-top: $spacing-md;
  }

  &__import-progress {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    padding: $spacing-md 0;
  }

  &__import-progress-bar {
    height: 4px;
    background: var(--border-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__import-progress-fill {
    height: 100%;
    background: var(--highlight-color);
    border-radius: $radius-full;
    transition: width 0.3s ease;
  }

  &__import-progress-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__import-progress-pct {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--highlight-color);
    min-width: 3ch;
  }

  &__import-progress-msg {
    font-size: $font-size-sm;
    color: var(--text-color-secondary);
  }

  &__import-done {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__import-dashboard {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__import-summary {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;
  }

  &__import-summary-number {
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: var(--highlight-color);
  }

  &__import-summary-label {
    @include body-text;
    color: var(--text-color-secondary);
  }

  &__import-rate {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__import-rate-bar {
    height: 6px;
    background: var(--border-color);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__import-rate-fill {
    height: 100%;
    background: var(--success-color);
    border-radius: $radius-full;
    transition: width 0.5s ease;
  }

  &__import-rate-label {
    font-size: $font-size-sm;
    color: var(--text-color-muted);
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
