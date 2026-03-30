# AGENTS.md — Bookshelf

Bookshelf is a **Product Challenge** on [Frontend Mentor](https://www.frontendmentor.io), a platform where developers build real projects to grow their skills. No Figma, multi-session build. You're a collaborative builder.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Nuxt 4** (Vue 3.5+, Nitro 2, TypeScript strict) |
| Styling | **SCSS** + CSS custom properties (no Tailwind) |
| Auth | **Better Auth** (email+password, session-based) |
| Database | **PostgreSQL** via **Neon** (serverless) |
| ORM | **Drizzle ORM** (type-safe schema, migrations) |
| Book APIs | **Open Library** (primary) + **Google Books** (enrichment/fallback) |
| Hosting | **Vercel** |
| Icons | **Lucide Vue** |
| Themes | Light, Dark, Sepia, High Contrast (CSS custom properties + `data-theme`) |

## Differentiators

All 6 are in scope. This is a long-lived, full-stack production application.

1. Animated shelf & cover interactions
2. AI-powered reading companion
3. Social sharing & reading cards
4. Goodreads data migration
5. Reading statistics dashboard
6. Accessibility-first reading tracker

## Project Documentation

| File | Contents |
|------|----------|
| `docs/ARCHITECTURE.md` | Project structure, tech stack rationale, key patterns |
| `docs/DATABASE.md` | Full schema design, relationships, indexes, guest strategy |
| `docs/API-STRATEGY.md` | Dual-API approach, caching, error handling, normalization |
| `docs/DECISIONS.md` | Architecture Decision Records (ADRs) |
| `docs/ROADMAP.md` | Phased build plan |

## Specs & Guidance

| File | Contents |
|------|----------|
| `spec/product-definition.md` | What, who, why |
| `spec/core-requirements.md` | Core + Stretch features with acceptance criteria |
| `spec/design-challenges.md` | 3 features the developer designs |
| `spec/technical-requirements.md` | Database, auth, Book API, deployment |
| `spec/differentiators.md` | 6 optional enhancements (all selected) |
| `guidance/brand-kit.md` | Colors, type (Lora + Inter), spacing, mood |
| `guidance/patterns.md` | UI/UX do's and don'ts |
| `guidance/accessibility.md` | WCAG checklist |
| `starter/tokens.css` | CSS custom properties |
| `data/` | Sample books (JSON + CSV) + edge case docs |

## Collaboration

- **Specified features** → implement to spec
- **Design-it-yourself features** → ask clarifying questions first
- **Brand kit** → `guidance/brand-kit.md` is the design source of truth
- **Architecture docs** → `docs/` is the technical source of truth — read before making structural changes
- **Multiple agents may work in parallel** — check `docs/ROADMAP.md` for phase/task ownership

Aim for accessible, semantic, responsive-first code with clean component boundaries. Document significant product and design decisions in `docs/DECISIONS.md`.
