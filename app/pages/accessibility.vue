<template>
  <div class="a11y">
    <h1 class="a11y__title">Accessibility Statement</h1>
    <p class="a11y__intro">
      Bookshelf is committed to providing an accessible experience for all readers.
      We strive to meet <strong>WCAG 2.1 Level AA</strong> standards and go beyond where possible.
    </p>

    <section class="a11y__section">
      <h2 class="a11y__heading">Standards</h2>
      <p>
        This application targets conformance with the
        <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>.
        We regularly test with keyboard navigation, screen readers, and automated audit tools.
      </p>
    </section>

    <section class="a11y__section">
      <h2 class="a11y__heading">Features</h2>
      <ul class="a11y__list">
        <li>
          <strong>Keyboard navigation</strong> &mdash; Every interactive element is reachable via Tab, and focus indicators are always visible.
        </li>
        <li>
          <strong>Skip links</strong> &mdash; A "Skip to content" link bypasses navigation on every page.
        </li>
        <li>
          <strong>Screen reader support</strong> &mdash; ARIA landmarks, roles, and live regions announce dynamic changes like search results and shelf updates.
        </li>
        <li>
          <strong>Semantic HTML</strong> &mdash; Proper heading hierarchy, landmark regions, and list structures throughout.
        </li>
        <li>
          <strong>Colour contrast</strong> &mdash; All text meets AA contrast ratios. An optional <em>High contrast</em> mode achieves AAA.
        </li>
        <li>
          <strong>Reduced motion</strong> &mdash; Animations respect <code>prefers-reduced-motion</code>. A simplified shelf view option removes 3D effects entirely.
        </li>
        <li>
          <strong>Dyslexia-friendly font</strong> &mdash; Switch to Atkinson Hyperlegible in Settings &rarr; Appearance &rarr; Font.
        </li>
        <li>
          <strong>Adjustable font size &amp; line height</strong> &mdash; Choose from four levels in Settings &rarr; Appearance &rarr; Accessibility.
        </li>
        <li>
          <strong>High contrast mode</strong> &mdash; Boosts text and border contrast to AAA levels, available in Accessibility settings.
        </li>
        <li>
          <strong>Color-blind safe mode</strong> &mdash; Replaces red/green indicators with a blue/orange palette, suitable for deuteranopia and protanopia.
        </li>
        <li>
          <strong>Reading progress</strong> &mdash; Progress bars include <code>aria-valuenow</code>, <code>aria-valuemin</code>, <code>aria-valuemax</code>, and text percentages alongside visual fills.
        </li>
        <li>
          <strong>Book covers</strong> &mdash; Every cover image has meaningful alt text. Titles and authors are always displayed as real text.
        </li>
        <li>
          <strong>Three themes</strong> &mdash; Light (sepia-warm), Dark (espresso), and OLED (true black) to match your environment and preferences.
        </li>
      </ul>
    </section>

    <section class="a11y__section">
      <h2 class="a11y__heading">Known Limitations</h2>
      <ul class="a11y__list">
        <li>
          Some third-party book description content may not have optimal semantic structure.
        </li>
        <li>
          Statistics charts are enhanced with ARIA labels but may not fully convey complex data patterns to screen reader users. A data table fallback is planned.
        </li>
      </ul>
    </section>

    <section class="a11y__section">
      <h2 class="a11y__heading">Feedback</h2>
      <p>
        If you encounter an accessibility barrier or have suggestions, please
        <NuxtLink to="/settings#account">contact us through your account settings</NuxtLink>.
        We take all accessibility feedback seriously and aim to resolve issues promptly.
      </p>
    </section>

    <section class="a11y__section">
      <h2 class="a11y__heading">Testing</h2>
      <p>
        We test with NVDA and VoiceOver screen readers, keyboard-only navigation,
        browser zoom up to 200%, Lighthouse accessibility audits, and the axe browser extension.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Accessibility — Bookshelf' })
</script>

<style lang="scss" scoped>
@use "~/assets/scss/variables" as *;
@use "~/assets/scss/mixins" as *;

.a11y {
  @include container($page-max-width);
  max-width: 720px;

  &__title {
    @include heading($font-size-2xl);
    margin-bottom: $spacing-md;
  }

  &__intro {
    @include body-text;
    color: var(--text-color-secondary);
    margin-bottom: $spacing-2xl;
  }

  &__section {
    margin-bottom: $spacing-2xl;
  }

  &__heading {
    @include heading($font-size-lg);
    margin-bottom: $spacing-sm;
  }

  &__list {
    list-style: disc;
    padding-left: $spacing-lg;
    @include body-text;

    li {
      margin-bottom: $spacing-sm;
    }

    code {
      font-family: $font-family-mono;
      font-size: $font-size-sm;
      background: var(--sub-bg-color);
      padding: 1px 4px;
      border-radius: $radius-sm;
    }
  }

  p {
    @include body-text;
    color: var(--text-color-secondary);
  }

  a {
    color: var(--highlight-color);
    text-decoration: underline;

    &:hover {
      color: var(--highlight-color-hover);
    }
  }
}
</style>
