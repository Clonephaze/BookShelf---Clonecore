# Bookshelf

**Your reading life, beautifully organized.**

A full-stack reading tracker built as a [Frontend Mentor](https://www.frontendmentor.io) Product Challenge. Search for books, organize them into shelves, track reading progress, set goals, time reading sessions, and explore rich year-in-review statistics.

**Live:** [bookshelf-clonecore.vercel.app](https://bookshelf-clonecore.vercel.app)

---

## Features

- **Library & Shelves** — Organize books into default and custom shelves with drag-and-drop, sorting, and cover art
- **Book Search** — Dual-API search (Open Library + Google Books) with ISBN support, deduplication, and progressive cover enhancement
- **Reading Progress** — Page-by-page tracking with visual indicators, milestone celebrations, and completion prompts
- **Reading Goals** — Yearly, monthly, and weekly targets with pace tracking (ahead / on track / behind)
- **Reading Sessions** — Timed sessions with pause/resume, ambient mode, pages-per-hour stats, and streak tracking
- **Statistics Dashboard** — Monthly charts, genre breakdown, rating distribution, reading heatmap, pace trends, and author diversity
- **Year in Review** — Narrative storytelling experience with shareable cards (Canvas API image generation)
- **Discover** — "Because you read…" recommendations via collaborative filtering, genre affinity, and author connections
- **Friends** — Lightweight social layer with username search, activity feeds, and privacy controls
- **Goodreads Import** — Full CSV parsing with fuzzy matching, conflict resolution, and import statistics
- **Guest Mode** — One-click demo with 45 pre-seeded books across shelves, ratings, progress, and goals
- **Progress Intelligence** — Pace projections, finish-date estimates, stale book detection, and contextual nudges
- **Command Palette** — Ctrl+K quick navigation and library search
- **PWA** — Installable with offline shell, service worker caching for covers and fonts

## Accessibility

- WCAG AAA high contrast mode
- Dyslexia-friendly font option (Atkinson Hyperlegible)
- Customizable font size and line height
- Color-blind safe mode
- Full keyboard navigation
- Skip links, ARIA landmarks, and live regions
- `prefers-reduced-motion` respected throughout

## Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | Nuxt 4 (Vue 3.5, Nitro 2, TypeScript strict) |
| **Styling** | SCSS + CSS custom properties |
| **Auth** | Better Auth (email + password, session-based) |
| **Database** | PostgreSQL via Neon (serverless) |
| **ORM** | Drizzle ORM |
| **Book APIs** | Open Library (primary) + Google Books (enrichment/fallback) |
| **Hosting** | Vercel (SSR) |
| **Icons** | Lucide Vue |
| **Testing** | Vitest + @nuxt/test-utils + @vue/test-utils |
| **PWA** | @vite-pwa/nuxt |

## Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|------|:-----------:|:------------:|:--------------:|:---:|
| Landing | 97 | 91 | 100 | 100 |
| Library | 93 | 96 | 100 | 100 |
| Discover | 99 | 94 | 100 | 100 |

## Themes

Three built-in themes plus system auto-detection:

- **Light** — Warm sepia-parchment
- **Dark** — Deep espresso
- **OLED** — True black

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) recommended)

### Setup

```bash
git clone <repo-url>
cd bookshelf
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_BOOKS_API_KEY=your-key        # optional, enriches search results
```

Push the database schema:

```bash
npx drizzle-kit push
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm run test:run    # single run
npm run test        # watch mode
```

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
app/
├── assets/scss/     # SCSS: variables, themes, mixins, animations
├── components/      # Vue components (BookCover, BookGrid, ShareCardModal, …)
├── composables/     # Shared logic (useTheme, useAppearance, useShareCard, …)
├── layouts/         # default, auth, landing
├── middleware/       # Route guards (auth, guest)
├── pages/           # File-based routing
├── plugins/         # Auth watcher, appearance init
├── stores/          # Pinia stores (library, session, import)
└── utils/           # Helpers (avatars, formatting)
server/
├── api/             # Nitro API routes
├── database/        # Drizzle schema + connection
├── middleware/       # Server auth middleware
└── services/        # Book API adapters, search service
docs/                # Architecture, database, API strategy, decisions
spec/                # Product definition, requirements, differentiators
guidance/            # Brand kit, UI patterns, accessibility checklist
```

## License

This project was built as a learning exercise for the Frontend Mentor Product Challenge.
