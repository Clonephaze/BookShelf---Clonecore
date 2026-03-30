# Architecture Decision Records

Log of significant decisions. Newest first.

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
