# Architecture

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Nuxt 4 (Vue 3.5+, Nitro 2) | Full-stack SSR/SSG, server routes for API proxying, file-based routing |
| **Language** | TypeScript (strict) | Type safety across client + server, Drizzle schema types flow to components |
| **Styling** | SCSS + CSS custom properties | Full control, nesting, mixins for themes, no utility framework dependency |
| **Auth** | Better Auth | Framework-agnostic, session-based, email+password, password reset, social login ready |
| **Database** | PostgreSQL (Neon) | Serverless Postgres, great Vercel integration, generous free tier |
| **ORM** | Drizzle ORM | Type-safe schema, lightweight, excellent Postgres support, migration tooling |
| **Book APIs** | Open Library + Google Books | Dual-API strategy for resilience and data quality (see `docs/API-STRATEGY.md`) |
| **Hosting** | Vercel | Nuxt SSR support, edge functions, environment variable management |
| **Icons** | Lucide Vue | Clean, consistent, tree-shakeable |

## Project Structure

```
bookshelf/
├── app/                          # Nuxt app directory (Nuxt 4 default)
│   ├── assets/
│   │   └── scss/
│   │       ├── _tokens.scss      # Design tokens as SCSS variables + CSS custom props
│   │       ├── _themes.scss      # Theme definitions (light, dark, sepia, high-contrast)
│   │       ├── _mixins.scss      # Responsive, typography, component mixins
│   │       ├── _reset.scss       # CSS reset/normalize
│   │       └── main.scss         # Entry point, imports all partials
│   ├── components/
│   │   ├── app/                  # App shell: sidebar, header, navigation
│   │   ├── book/                 # BookCard, BookCover, BookDetail, BookGrid
│   │   ├── shelf/                # ShelfList, ShelfSection, ShelfSelector
│   │   ├── search/               # SearchBar, SearchResults, SearchResultCard
│   │   ├── progress/             # ProgressBar, ProgressInput, ProgressRing
│   │   ├── goal/                 # GoalTracker, GoalSetup, GoalCelebration
│   │   ├── stats/                # Charts, YearInReview, StatCard
│   │   ├── auth/                 # LoginForm, SignupForm, AuthGuard
│   │   ├── landing/              # Hero, FeatureHighlights, CTASection
│   │   └── ui/                   # Buttons, inputs, modals, skeletons, toast
│   ├── composables/
│   │   ├── useAuth.ts            # Auth state, login/logout/signup
│   │   ├── useBooks.ts           # Book CRUD, search, library queries
│   │   ├── useShelves.ts         # Shelf management, reordering
│   │   ├── useProgress.ts        # Reading progress updates
│   │   ├── useGoals.ts           # Goal CRUD, pace calculations
│   │   ├── useGuest.ts           # Guest session management
│   │   ├── useTheme.ts           # Theme switching, system preference detection
│   │   └── useToast.ts           # Toast notifications
│   ├── layouts/
│   │   ├── default.vue           # App shell: sidebar + main content area
│   │   ├── auth.vue              # Centered, minimal layout for login/signup
│   │   └── landing.vue           # Full-width, no sidebar for landing page
│   ├── pages/
│   │   ├── index.vue             # Landing page
│   │   ├── login.vue             # Sign in
│   │   ├── signup.vue            # Sign up
│   │   ├── reset-password.vue    # Password reset
│   │   ├── library/
│   │   │   ├── index.vue         # Library overview (all shelves preview)
│   │   │   └── [shelf].vue       # Individual shelf view
│   │   ├── book/
│   │   │   └── [id].vue          # Book detail view
│   │   ├── search.vue            # Book search (API)
│   │   ├── goals.vue             # Reading goals
│   │   ├── stats/
│   │   │   ├── index.vue         # Stats dashboard
│   │   │   └── year/[year].vue   # Year-in-review
│   │   └── settings.vue          # User preferences, theme, account
│   ├── middleware/
│   │   ├── auth.ts               # Redirect unauthenticated users
│   │   └── guest.ts              # Load guest data if guest session
│   └── plugins/
│       └── better-auth.client.ts # Better Auth client initialization
├── server/
│   ├── api/
│   │   ├── books/                # Book CRUD endpoints
│   │   │   ├── search.get.ts     # Proxy search to Open Library / Google Books
│   │   │   ├── [id].get.ts       # Get book details
│   │   │   ├── index.post.ts     # Add book to library
│   │   │   ├── [id].put.ts       # Update book (rating, notes, shelf)
│   │   │   └── [id].delete.ts    # Remove book from library
│   │   ├── shelves/              # Shelf CRUD endpoints
│   │   │   ├── index.get.ts      # List user's shelves
│   │   │   ├── index.post.ts     # Create shelf
│   │   │   ├── [id].put.ts       # Update shelf (rename, reorder)
│   │   │   ├── [id].delete.ts    # Delete shelf
│   │   │   └── [id]/books.get.ts # Get books on a shelf
│   │   ├── progress/             # Progress tracking endpoints
│   │   │   └── [bookId].put.ts   # Update reading progress
│   │   ├── goals/                # Goal endpoints
│   │   │   ├── index.get.ts      # Get goals
│   │   │   ├── index.post.ts     # Set goal
│   │   │   └── [id].put.ts       # Update goal
│   │   ├── stats/                # Statistics endpoints
│   │   │   ├── overview.get.ts   # Dashboard stats
│   │   │   └── year/[year].get.ts # Year-in-review data
│   │   └── auth/
│   │       └── [...].ts          # Better Auth catch-all handler
│   ├── database/
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   ├── migrations/           # Drizzle migration files
│   │   └── index.ts              # DB connection + Drizzle instance
│   ├── services/
│   │   ├── book-api/
│   │   │   ├── index.ts          # Unified BookService interface
│   │   │   ├── open-library.ts   # Open Library adapter
│   │   │   ├── google-books.ts   # Google Books adapter
│   │   │   └── types.ts          # Shared API response types
│   │   ├── book.service.ts       # Business logic: add, remove, deduplicate
│   │   ├── shelf.service.ts      # Shelf management logic
│   │   ├── progress.service.ts   # Progress tracking logic
│   │   ├── goal.service.ts       # Goal calculations, pace tracking
│   │   └── stats.service.ts      # Statistics aggregation
│   └── utils/
│       ├── auth.ts               # Better Auth server instance
│       └── db.ts                 # Drizzle client singleton
├── shared/
│   └── types/                    # Types shared between client + server
│       ├── book.ts
│       ├── shelf.ts
│       ├── user.ts
│       └── api.ts
├── docs/                         # Project documentation
│   ├── ARCHITECTURE.md           # ← You are here
│   ├── DATABASE.md               # Schema design + rationale
│   ├── API-STRATEGY.md           # Book API integration approach
│   ├── DECISIONS.md              # Architecture Decision Records
│   └── ROADMAP.md                # Phased build plan
├── data/                         # Sample data (from starter)
├── spec/                         # Product specs (from starter)
├── guidance/                     # Brand kit, patterns, a11y (from starter)
├── nuxt.config.ts
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Key Architecture Decisions

### Server-side API Proxying
All external API calls (Open Library, Google Books) go through Nuxt server routes. This:
- Keeps API keys secret (Google Books key never hits the client)
- Allows response normalization server-side
- Enables caching at the server layer (Nitro cache)
- Provides a single interface regardless of which API answered

### Theme System
Themes are implemented via CSS custom properties on `:root` / `[data-theme]`, with SCSS providing the authoring experience (nesting, mixins, maps). Planned themes:
- **Light** (default) — warm off-white, `tokens.css` light mode
- **Dark** — deep warm black, `tokens.css` dark mode
- **Sepia** — warm reading mode, even more papery
- **High Contrast** — WCAG AAA ratios, accessibility differentiator

Theme preference stored in user settings (DB for authenticated, localStorage for guests). System preference (`prefers-color-scheme`) used as default.

### Guest Mode Architecture
Guest sessions use the same UI and composables as authenticated sessions. The difference is data source:
- **Authenticated**: Server API → PostgreSQL
- **Guest**: Server API → Static JSON (loaded from `data/sample-books.json` with pre-built shelf assignments, progress, ratings)

Guest data is held in a server-side session (or client state) and is not persisted. This means guest mode exercises the exact same components — it's not a separate code path.

### Composables as the API Layer
Vue composables (`useBooks`, `useShelves`, etc.) are the single interface between components and data. Components never call `$fetch` directly. This:
- Provides reactive state management
- Handles optimistic updates
- Abstracts away guest vs. authenticated data sources
- Makes testing straightforward
