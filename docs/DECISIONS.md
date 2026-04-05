# Architecture Decision Records

Log of significant decisions. Newest first.

---

## ADR-010: Non-Blocking Fetch Pattern for Page Performance

**Date:** 2026-04-05
**Status:** Accepted

Composables that fetch data (e.g. `useGoals`) must not use top-level `await` in `<script setup>`. A top-level `await` triggers Nuxt's `<Suspense>`, which blocks page transitions until the API responds — causing a visible freeze on every navigation.

**Pattern:** Call `fetchGoals()` (no `await`) at component top level. The composable manages its own `loading` ref; the template renders a skeleton/spinner while loading. A dedup flag (`_fetched`) skips redundant fetches unless `force=true` is passed.

This applies to any composable used in layout-level components (GoalWidget in library) or pages where perceived performance matters.

---

## ADR-009: Multi-Period Reading Goals

**Date:** 2026-04-05
**Status:** Accepted

Expanded the reading goals system from yearly-only to **yearly, monthly, and weekly** book-count goals.

**Schema:** Added `periodType` TEXT column ('yearly' | 'monthly' | 'weekly', default 'yearly') and `periodValue` INTEGER column (0 for yearly, 1–12 for monthly, 1–53 for weekly). Unique constraint changed from `(userId, year)` to `(userId, periodType, year, periodValue)`.

**Composable:** `useGoals` uses Nuxt's `useState` (not plain `ref`) for shared, SSR-safe state that persists across navigations. Provides generic per-goal helpers (`goalProgress`, `goalPaceStatus`, `goalPaceLabel`) that work for any period type, plus convenience shortcuts for the primary yearly goal.

**Daily goals deferred:** Daily book-count goals don't make sense (you rarely finish a book in a day). Daily goals will arrive as "read X minutes/day" with the **Reading Sessions** feature (Phase 11). Session-based goals are a separate goal type but will be displayed on the goals page alongside book-count goals ("separate, but add to both").

**Book counting:** The API counts books by `dateFinished` within the period — `extract(year from dateFinished)` for yearly, `extract(month from dateFinished)` for monthly, `extract(week from dateFinished)` for weekly. Any book with a `dateFinished` in the target period counts, regardless of shelf.

---

## ADR-008: Roadmap Expansion — Friends, Sessions, Intelligence, Recs (No AI)

**Date:** 2026-04-04
**Status:** Accepted

Added four custom features to the roadmap as new phases:

- **Friends** (Phase 13): Username-based friend system. Read-only social — see each other's shelves, progress, goals. No messaging, no comments. Requires adding usernames to auth (retrofitted into Phase 1 as an open task).
- **Reading Sessions** (Phase 11): Timed reading sessions with page input at end. Feeds pace analytics (pages/hour, session streaks).
- **Progress Intelligence** (Phase 12): Data-driven insights — pace projections ("finish in 3 days"), goal tracking ("ahead by 12%"), stale book detection.
- **"Because You Read…" Engine** (Phase 14): Book recommendations via collaborative filtering and genre/author overlap. No AI — uses reading data across users. Transparent reasoning ("because you liked X").

**Removed:** AI-Powered Reading Companion (differentiator #2). Authors and curators already make great rec lists; the "Because You Read…" engine achieves recommendations through user data instead.

Differentiators reduced from 6 to 5. Total roadmap phases expanded from 12 to 16.

---

## ADR-007: Theme Consolidation — 4 Themes → 3

**Date:** 2026-04-04
**Status:** Accepted

Consolidated from 4 themes (Light, Dark, Sepia, High Contrast) to 3 themes (Light, Dark, OLED).

**Changes:**
- **Light** now uses warm sepia-toned parchment colors (inspired by Apple Books / Kindle sepia modes). The previous "light" was too cool/neutral, and sepia was redundant as a separate theme.
- **Dark** shifted to richer, neutral espresso browns. Previous dark had a yellow-green tint.
- **High Contrast** (blinding white bg + black text) replaced with **OLED** — true `#000` background, high contrast text, warm accents. Serves accessibility needs (high contrast ratios) and OLED display optimization.
- Sepia removed as standalone theme since its identity is now the default light mode.

**DB note:** The `user_preferences.theme` column is a text field (no enum constraint), so 'sepia'/'high-contrast' values from existing users are handled gracefully — they fall back to system default on next load.

---

## ADR-006: Vitest Testing Strategy

**Date:** 2026-03-30
**Status:** Accepted

Using **Vitest** with **@nuxt/test-utils** and **@vue/test-utils** (happy-dom) for testing. Tests live in `tests/` mirroring the source structure (`composables/`, `middleware/`, `server/`).

**What gets tested:** Composables with logic, route middleware, server utilities, API handlers, and anything where a silent failure would break core functionality (auth redirects, session enforcement, env var validation, theme persistence).

**What doesn't get tested:** Static layouts, pass-through components, third-party library internals.

**Convention:** New non-trivial composables, middleware, and server handlers ship with tests. Run `npm run test:run` before pushing. Tests are part of the roadmap deliverable for each phase.

---

## ADR-005: All Six Differentiators

**Date:** 2026-03-30
**Status:** Accepted

All six differentiators are in scope: animated shelf interactions, AI companion, social sharing cards, Goodreads migration, reading statistics dashboard, and accessibility-first tracker. The project is intentionally long-lived and ambitious — it's a real tool, not a demo. Differentiators will be layered in across phases rather than all at once.

---

## ADR-004: Dual Book API (Open Library + Google Books)

**Date:** 2026-03-30
**Status:** Accepted

Using both Open Library (primary, free, no key) and Google Books (enrichment/fallback, API key required) behind a unified `BookService`. Search fires both in parallel, merges and deduplicates by ISBN. This provides resilience (one API down doesn't break search) and better data quality (best metadata from each source). All API calls proxied through Nuxt server routes to keep keys secret and enable Nitro caching. Full strategy in `docs/API-STRATEGY.md`.

---

## ADR-003: Better Auth + Neon PostgreSQL + Drizzle ORM

**Date:** 2026-03-30
**Status:** Accepted

**Auth:** Better Auth over Supabase Auth or NextAuth. Framework-agnostic, clean API, supports email+password with session-based auth, and has a Nuxt integration. Social login can be added later.

**Database:** PostgreSQL on Neon (serverless). Neon chosen for its free tier, Vercel integration, and serverless connection pooling via `@neondatabase/serverless`. No need for Supabase's full platform when we're only using the database.

**ORM:** Drizzle over Prisma. Lighter weight, type-safe schema as TypeScript, generates SQL migrations, and the query builder maps naturally to SQL. Schema types flow directly into API responses and Vue composables.

---

## ADR-002: SCSS + CSS Custom Properties (No Tailwind)

**Date:** 2026-03-30
**Status:** Accepted

Vanilla CSS and SCSS with the brand kit's CSS custom properties. No utility framework. SCSS provides nesting, mixins for the theme system (`@mixin apply-theme`), `@use` for modular token files, and functions for responsive calculations. The theme system uses `[data-theme]` attribute selectors with CSS custom property overrides — one set of component styles works across all four themes.

---

## ADR-001: Nuxt 4 + TypeScript

**Date:** 2026-03-30
**Status:** Accepted

Nuxt 4 with Vue 3.5+ and TypeScript strict mode. Chosen for: file-based routing, built-in server routes (Nitro 2) for API proxying, SSR for landing page performance, auto-imports of composables and components, and strong TypeScript integration. The server directory gives us a clean backend layer without a separate API server.
