# Bookshelf - Jack

A personal reading tracker where you search for books, organize them into shelves, track reading progress, and explore year-in-review statistics.

**Live URL:** [bookshelf-clonecore.vercel.app](https://bookshelf-clonecore.vercel.app)

![Screenshot of your solution](./screenshot.png)

---

## Overview

Full-stack reading tracker built from scratch with Nuxt 4. Real accounts, real email, real database - not a demo. The goal is all 6 differentiators: animated shelves, AI reading companion, social sharing cards, Goodreads migration, reading stats dashboard, and accessibility-first tracking.

Still in progress. Auth, app shell, guest mode, settings, and email integration are done. Book search and library management are next.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 4 (Vue 3.5, Nitro 2, TypeScript strict) |
| Database | PostgreSQL on Neon (serverless) |
| Authentication | Better Auth (email+password, session-based) |
| ORM | Drizzle ORM |
| Book API | Open Library (primary) + Google Books (enrichment/fallback) |
| Hosting | Vercel |
| Styling | SCSS + CSS custom properties (no Tailwind or other CSS frameworks) |
| Email | Resend (clonecore.net domain) |
| Icons | Lucide Vue |
| Testing | Vitest + @nuxt/test-utils |

---

## Design Decisions

These are the product and design choices I made where the spec left room for interpretation.

### Year-in-Review & Reading Insights

*Not yet implemented - coming in a later phase.*

### Book Discovery & Recommendations

*Not yet implemented - coming with Phase 2 (Book Search).*

### Reading Progress Tracking UX

*Not yet implemented - coming with Phase 4 (Book Detail & Personal Data).*

### Other Design Choices

**Settings page** - Designed it early with 7 sections (Appearance, Account, Reading, Notifications, Privacy & Sharing, Data, Danger Zone) instead of a flat page. Only Appearance, Account, and Danger Zone are live. The rest show "Coming with [feature]" badges so the structure is ready when features land.

**Guest mode** - Cookie-based, 24-hour expiry. Guests can browse the app shell without signing up. The middleware checks the guest cookie alongside real sessions. When a guest signs up and gets a real session, the guest cookie is cleared automatically.

**Auth UX polish** - Confirm password on sign-up. Auto sign-in after password reset (the reset email URL carries the user's email as a query param, so the reset page can call signIn immediately after). Welcome email on sign-up via Resend.

**Landing page** - Two-row CTA layout: Sign Up + Sign In on the first row, "Try as Guest" as an underlined text link below. Simple and clear.

**Theme system** - Four themes (light, dark, sepia, high contrast) via `:root.{theme}-mode` CSS classes. All component styles use CSS custom properties - one set of styles works across all themes.

---

## Development Journey

### Initial Approach vs. Final

Started with a full planning phase before writing any code - architecture docs, database schema, API strategy, ADRs, phased roadmap. This paid off massively. When it came time to build, decisions were already made and documented. The schema hasn't needed changes.

The biggest shift was around production deployment. Planned for it early but still hit real-world issues: Better Auth origin validation failing because Vercel's deployment URLs change per push, client-side auth hardcoded to localhost, session reactivity not propagating before navigation. Each of these required understanding the actual production environment, not just local dev.

### Decisions Reconsidered

**`navigateTo()` after sign-in** - Fired before Better Auth's reactive session updated, so the auth middleware bounced users back to login. Added a `waitForSession()` helper that watches the reactive state and only navigates once `isAuthenticated` is true.

**`VERCEL_URL` for auth origin** - This changes on every deployment. Switched to `VERCEL_PROJECT_PRODUCTION_URL` (stable) and added `trustedOrigins` to Better Auth config.

### What Surprised Me

The gap between "auth works locally" and "auth works in production" was significant. Origin validation, session propagation timing, and environment variable differences all needed separate fixes.

Browser autofill fighting is a real thing. Chrome applies its own background color to autofilled inputs regardless of your styles. Needed `:-webkit-autofill` overrides with the `box-shadow inset` trick.

### Session Breakdown

| Session | Focus | What I Accomplished |
|---------|-------|-------------------|
| Planning | Architecture & design | Full docs: architecture, database schema (11 tables), API strategy, ADRs, phased roadmap |
| 1 | Phase 0 - Scaffolding | Nuxt 4 project, SCSS pipeline with 4 themes, Drizzle schema + Neon migration, Better Auth setup, Vercel first deploy |
| 2 | Phase 1 - Auth & Shell | Sign up/in/out, password reset, app shell with sidebar + mobile nav, theme switcher, default shelves, route middleware, 30 tests |
| 3 | Production fixes & polish | Fixed prod auth (origin, baseURL, session propagation), guest mode, Resend email integration, settings redesign, welcome email, sign-in loading states |

---

## AI Collaboration Reflection

*Will be filled in at the end of the project.*

### How I Used AI

### What Worked Well

### What I Learned

### Where I Pushed Back

---

## Differentiators

### Chosen Differentiator(s)

All 6 selected. None fully implemented yet - they'll be layered in across phases.

1. Animated shelf & cover interactions
2. AI-powered reading companion
3. Social sharing & reading cards
4. Goodreads data migration
5. Reading statistics dashboard
6. Accessibility-first reading tracker

---

## Self-Assessment

*Will be filled in when the project is further along.*

| Category | Rating | Notes |
|----------|--------|-------|
| **Works for real users** | /5 | Auth works end-to-end on prod, no book features yet |
| **Book API integration** | /5 | Not started |
| **Design-it-yourself features** | /5 | Settings designed, others not started |
| **Design quality** | /5 | Brand kit applied, 4 themes working |
| **Responsive design** | /5 | Sidebar → mobile nav, auth pages responsive |
| **Performance** | /5 | Not measured yet |
| **Accessibility** | /5 | Semantic HTML, ARIA attributes on forms, not audited yet |
| **Edge case handling** | /5 | Auth edge cases handled, others TBD |
| **Code quality** | /5 | 30 tests, TypeScript strict, ADRs documented |
| **Landing page** | /5 | Functional, not polished yet |
| **Guest experience** | /5 | Can browse shell, no books to see yet |

### Lighthouse Scores

*Will be measured on deployed site after more features land.*

### Strengths

### Areas for Improvement

---

## Known Limitations

- No book search or library features yet - auth and app shell only
- Guest mode shows empty shelves (no seed data yet)
- Landing page is minimal - hero section with CTAs, no feature highlights
- No email verification (sign-up email is trusted immediately)
- Password reset emails only send when `RESEND_API_KEY` is configured

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/your-username/bookshelf.git
cd bookshelf

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your database and auth credentials

# Run the development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret for session signing |
| `BETTER_AUTH_URL` | Production URL for auth (e.g. `https://your-app.vercel.app`) |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key (for enrichment/fallback) |
| `RESEND_API_KEY` | Resend API key for transactional email (optional - falls back to console) |
| `BOOKSHELF_DEV` | Set to `true` to enable dev tools (reset link endpoint, etc.) |

---

## Acknowledgments

Built as a [Frontend Mentor Product Challenge](https://www.frontendmentor.io).
