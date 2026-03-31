<template>
  <NuxtLayout name="landing">
    <div class="privacy">
      <NuxtLink to="/" class="privacy__back">&larr; Back to home</NuxtLink>

      <h1 class="privacy__title">Privacy Policy</h1>
      <p class="privacy__updated">Last updated: March 31, 2026</p>

      <section class="privacy__section">
        <h2>What we collect</h2>
        <p>When you create an account, we store your <strong>name</strong>, <strong>email address</strong>, and a <strong>hashed password</strong>. We never store your password in plain text.</p>
        <p>As you use Bookshelf, we store the books you add, your shelves, reading progress, ratings, notes, and reading goals. This is the core data that makes the app work for you.</p>
      </section>

      <section class="privacy__section">
        <h2>How we use it</h2>
        <p>Your data is used solely to provide the Bookshelf service - organizing your library, tracking your reading, and generating your personal statistics. That's it.</p>
      </section>

      <section class="privacy__section">
        <h2>Email</h2>
        <p>We send transactional emails only: a welcome email when you sign up and password reset emails when you request them. We use <strong>Resend</strong> as our email provider. We will never send marketing emails or share your email with third parties.</p>
      </section>

      <section class="privacy__section">
        <h2>Cookies</h2>
        <p>We use two cookies, both essential for the app to function:</p>
        <ul>
          <li><strong>Session cookie</strong> - keeps you logged in (expires after 7 days)</li>
          <li><strong>Guest cookie</strong> - enables guest mode without an account (expires after 24 hours)</li>
        </ul>
        <p>We have no analytics, tracking, or advertising cookies. No cookie consent banner is needed because all cookies are strictly functional.</p>
      </section>

      <section class="privacy__section">
        <h2>Data storage</h2>
        <p>Your data is stored in a <strong>PostgreSQL database</strong> hosted on <strong>Neon</strong> (serverless Postgres). The application is hosted on <strong>Vercel</strong>. Both services operate data centers in the United States.</p>
        <p>Passwords are hashed using <strong>scrypt</strong> before storage. We cannot read your password.</p>
      </section>

      <section class="privacy__section">
        <h2>Third-party services</h2>
        <p>When you search for books, we query <strong>Open Library</strong> and <strong>Google Books</strong> on the server side. Your search queries are sent to these APIs but no personal information is shared with them.</p>
      </section>

      <section class="privacy__section">
        <h2>Your rights</h2>
        <p>You can <strong>delete your account</strong> at any time from Settings &rarr; Danger Zone. This permanently removes all your data - account, shelves, books, progress, notes, and statistics. This action is irreversible.</p>
        <p>Data export will be available in a future update.</p>
      </section>

      <section class="privacy__section">
        <h2>Changes</h2>
        <p>If this policy changes, we'll update the date at the top. For a portfolio project of this nature, changes will be infrequent.</p>
      </section>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({ title: 'Privacy Policy - Bookshelf' })
</script>

<style lang="scss" scoped>
@use "~/assets/scss/mixins" as *;

.privacy {
  @include container($page-max-width);
  max-width: 70ch;
  padding: $spacing-2xl $spacing-xl;

  &__back {
    @include meta-text;
    display: inline-block;
    color: var(--text-color-secondary);
    margin-bottom: $spacing-xl;

    &:hover {
      color: var(--highlight-color);
    }
  }

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-xs;
  }

  &__updated {
    @include meta-text;
    margin-bottom: $spacing-2xl;
  }

  &__section {
    margin-bottom: $spacing-xl;

    h2 {
      @include heading($font-size-lg);
      margin-bottom: $spacing-sm;
    }

    p {
      @include body-text;
      color: var(--text-color-secondary);
      line-height: 1.7;
      margin-bottom: $spacing-sm;
    }

    ul {
      @include body-text;
      color: var(--text-color-secondary);
      line-height: 1.7;
      padding-left: $spacing-lg;
      margin-bottom: $spacing-sm;

      li {
        margin-bottom: $spacing-xs;
      }
    }

    strong {
      color: var(--text-color);
      font-weight: $font-weight-semibold;
    }
  }
}
</style>
