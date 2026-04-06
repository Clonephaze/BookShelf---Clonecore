# Roadmap

Phased build plan. Each phase builds on the previous and results in a working, deployable state.

## Phase 0 — Project Scaffolding ✅
**Goal:** Empty Nuxt app running locally with all tooling configured.

- [x] Initialize Nuxt 4 project with TypeScript strict
- [x] Set up SCSS pipeline: `_variables.scss`, `_themes.scss`, `_mixins.scss`, `_reset.scss`, `main.scss`
- [x] Port `tokens.css` values into SCSS variables + CSS custom properties
- [x] Configure theme system: light (sepia-warm), dark (espresso), OLED (true black) via `:root.{theme}-mode` classes
- [x] Install and configure Drizzle ORM + Neon serverless driver
- [x] Write Drizzle schema (all 11 tables from `docs/DATABASE.md`)
- [x] Run initial migration against Neon
- [x] Set up Better Auth (server + client composable)
- [x] Create layouts: `default`, `auth`, `landing`
- [x] Set up Lucide Vue icons
- [x] Configure Vercel deployment (first deploy: empty shell)
- [x] Set up environment variables (`.env`, Vercel env vars)
- [x] Configure ESLint (Prettier skipped — not needed)
- [x] Set up Vitest + @nuxt/test-utils testing pipeline

**Deliverable:** Deployed empty app with auth working, DB connected, themes toggling.

---

## Phase 1 — Auth & Core Shell ✅
**Goal:** Users can sign up, log in, and see the app shell with sidebar navigation.

- [x] Sign up flow (email + password)
- [x] Sign in flow
- [x] Sign out
- [x] Password reset flow (forgot-password + reset-password pages, console-logged reset links for now)
- [x] Session persistence across refreshes (cookie-based sessions + client-side auth watcher plugin)
- [x] Protected route middleware (redirect to login)
- [x] App shell: sidebar navigation with shelves list
- [x] Create default shelves on account creation (Want to Read, Currently Reading, Read)
- [x] Theme switcher component (header)
- [x] Responsive sidebar (desktop sidebar + mobile bottom nav)
- [x] Basic page routing: library, search, goals, stats, settings
- [x] Unit tests: useTheme, auth middleware, session helpers, database singleton
- [ ] Usernames (unique display name, required at signup, used for friend system)

_Note: Usernames were not in the original Phase 1 scope. Added retroactively — needed before friends system._

**Deliverable:** Full auth flow, app shell with navigation, responsive layout.

---

## Phase 2 — Book Search & Library Foundation ✅
**Goal:** Users can search for books and add them to their library.

- [x] Server-side Open Library adapter
- [x] Server-side Google Books adapter
- [x] Unified BookService with parallel search, merge, dedup
- [x] Search API route (`/api/books/search`)
- [x] Search page with search bar, results grid, loading states
- [x] BookSearchResultCard component (cover, title, author, year)
- [x] "Add to shelf" action from search results
- [x] Book deduplication logic (ISBN match → reuse existing `books` row)
- [x] Missing cover placeholder component (title + author in brand typography)
- [x] Handle edge cases: no results, API errors, rate limiting, missing metadata
- [x] Nitro server-side caching for search results and book details
- [x] ISBN search support (ISBN-10 and ISBN-13)
- [x] Client-side result filters (has cover, has page count, genre)
- [x] Book detail modal (large cover, full metadata, add to shelf)
- [x] Animation foundation (`_animations.scss`: keyframes, easing, stagger)
- [x] 12 unit tests (adapters, merge/dedup, ISBN detection, failover)

**Deliverable:** Working book search with dual-API, books persist to database.

---

## Phase 3 — Shelves & Library View ✅
**Goal:** Users can browse their library, manage shelves, and view books on each shelf.

- [x] Library overview page (all shelves with preview thumbnails)
- [x] Individual shelf view (full book grid)
- [x] BookCard component (cover, title, author, rating, book-opening animation)
- [x] BookGrid component (responsive grid, consistent 2:3 covers, staggered entrance)
- [x] Book detail page (`/library/book/[id]`) structured for Phase 4/5 (progress, rating, notes, dates)
- [x] Create custom shelves
- [x] Rename custom shelves
- [x] Delete custom shelves (with confirmation)
- [x] Move book between shelves
- [x] Sort books within shelf (title, author, date added, rating)
- [x] Empty shelf states with guidance + search links
- [x] Loading skeletons for library/shelf views
- [x] Book-opening animation (3D cover flip with spine + pages reveal)
- [x] New shelf creation from library header
- [x] API routes: GET /api/library, GET /api/shelves/[id]/books, POST /api/shelves, PATCH /api/shelves/[id], DELETE /api/shelves/[id], PATCH /api/books/[id]/shelf, GET /api/books/[id]
- [x] Forward animation variables through _mixins.scss
- [x] 12 unit tests (slugification, sorting, data shapes, progress calculation)
- [x] 54 total tests passing, build clean

**Deliverable:** Full shelf management, library browsing, responsive book grids, book-opening animation.

---

## Phase 4 — Book Detail & Personal Data ✅
**Goal:** Rich book detail view with ratings, notes, and personal data.

_Note: Book detail page layout was built in Phase 3 with placeholder sections. Phase 4 activates the interactive features._

- [x] Star rating (1-5, interactive, keyboard accessible)
- [x] Personal notes (textarea with debounced auto-save)
- [x] Date started / date finished pickers
- [x] Link to Open Library / Google Books page
- [x] Optimistic UI for rating and notes updates
- [x] Graceful handling of sparse metadata (hide empty fields, adapt layout)
- [x] Toast notification system for save feedback

**Deliverable:** Complete book detail view with all personal data features.

---

## Phase 5 — Reading Progress ✅
**Goal:** Track reading progress with visual indicators and history.

- [x] Progress tracking on "Currently Reading" books
- [x] Page number input (direct entry + quick increment buttons: ±1, ±10)
- [x] Percentage fallback for books without page count
- [x] Progress bar component (animated fill, warm accent color)
- [x] Progress visible on library overview (thin bar on book cover)
- [x] Quick progress update from library view (BookDetailPanel slide-in)
- [x] Progress history logging (`reading_progress_log` table)
- [x] 100% completion prompt → move to "Read" shelf (auto-sets dateFinished)
- [x] Milestone moments (50%, 90%, 100%) with toast celebrations
- [x] "Last updated" timestamp display
- [x] Optimistic UI for progress updates

**Deliverable:** Full reading progress tracking with history and visual feedback.

---

## Phase 6 — Reading Goals ✅
**Goal:** Annual reading goals with pace tracking.

- [x] Set goal for current year (target books count)
- [x] Goal progress display (books completed vs target)
- [x] Visual progress indicator (progress ring or bar)
- [x] Pace calculation (ahead / on track / behind based on date)
- [x] Edit goal mid-year
- [x] No-goal state (CTA to set one, no broken UI)
- [x] Goal completion celebration (confetti or positive visual moment)
- [x] Goal history (view past years)

**Deliverable:** Working reading goals with pace tracking and celebration.

---

## Phase 7 — Guest Experience ✅
**Goal:** "Try as Guest" provides a compelling, fully populated demo.

- [x] Guest mode entry from landing page (single click)
- [x] Guest session management (server-side or client state)
- [x] Seed script: generate guest data JSON from `data/sample-books.json`
- [x] Pre-assign 45 books across shelves (~15 Read, ~5 Currently Reading, ~15 Want to Read, ~5 custom)
- [x] Pre-populate ratings, notes, dates, progress on relevant books
- [x] Pre-populate reading goal (24 books, 15 complete)
- [x] Pre-populate year-in-review stats
- [x] Guest can browse shelves, view details, explore stats
- [x] Gentle sign-up prompts (not aggressive gating)
- [x] Guest data is session-based, not persisted
- [x] Guest → sign-up conversion (keep guest data? or fresh start — decide)

**Deliverable:** Fully populated guest experience that showcases the entire app.

---

## Phase 8 — Landing Page ✅
**Goal:** Compelling first impression that converts visitors.

- [x] Hero section with value proposition
- [x] Feature highlights (3-4 key features)
- [x] Visual showcase (book covers, shelves, statistics screenshots)
- [x] Dual CTAs: "Sign Up" and "Try as Guest"
- [x] Responsive design (mobile through desktop)
- [x] Fast load time (minimal JS on landing page, SSR)
- [x] Warm literary aesthetic from first second

**Deliverable:** Production-quality landing page.

---

## Phase 9 — Statistics & Year-in-Review (Design Challenge) ✅
**Goal:** Reading statistics dashboard and year-in-review experience.

- [x] Stats dashboard page (`/stats`)
- [x] Books read per month (bar chart)
- [x] Genre breakdown (interactive donut chart)
- [x] Total pages read, average pages per book
- [x] Average rating, rating distribution
- [x] Reading pace (pages per day, books per month trend)
- [x] Year-in-review page (`/stats/year/[year]`)
- [x] Narrative/visual storytelling (not just charts)
- [x] Handle sparse data gracefully (3 books vs 50 books)
- [x] "So far this year" vs completed year views
- [x] Author diversity stats

**Deliverable:** Comprehensive stats dashboard and shareable year-in-review.

---

## Phase 10 — Stretch Features ✅
**Goal:** Polish and depth.

- [x] Progressive Web App (`@vite-pwa/nuxt`: manifest, service worker, offline shell, install prompt)
- [x] Goodreads CSV import (parse, preview, map shelves, conflict resolution)
- [x] Library search (search own books, debounced, Cmd+K shortcut)
- [x] Command palette for power users

---

## Phase 11 — Reading Sessions ✅
**Goal:** Timed reading sessions that feed pace analytics.

- [x] Start a reading session: pick a book, set a timer duration (or open-ended)
- [x] Timer UI (countdown, pause/resume, ambient mode option)
- [x] Session end prompt: enter new page number
- [x] Calculate pages read per session
- [x] Session history log (`reading_sessions` table: book, start time, duration, pages read)
- [x] Stats derived from sessions: pages per hour, average session length
- [x] Weekly / monthly / yearly session summaries
- [x] Session streaks (consecutive days with a session)
- [x] Integrate session data into Phase 9 stats dashboard

**Deliverable:** Timed reading sessions with pace tracking and historical data.

---

## Phase 12 — Progress Intelligence ✅
**Goal:** Smart insights derived from reading data.

- [x] "At your current pace, you'll finish in X days" (per-book projection)
- [x] "You're ahead of your yearly goal by X%" / "You need to read X books/month to catch up"
- [x] Pace trends: "You read faster on weekends" / "Your pace has increased this month"
- [x] Milestone predictions: "You'll hit 50 books by October at this rate"
- [x] Stale book detection: "You haven't updated [Book] in 3 weeks"
- [x] Contextual nudges on library/dashboard (non-intrusive, dismissable)
- [x] All projections based on actual session + progress log data

**Deliverable:** Intelligent, data-driven reading insights throughout the app.

---

## Phase 13 — Friends ✅
**Goal:** Lightweight social layer — see friends' reading activity.

- [x] Username system (unique, required, changeable in settings)
- [x] Friend requests via username search
- [x] Accept / decline / remove friend
- [x] Friends list page (`/friends`)
- [x] Friend profile view: shelves, currently reading, recent activity, goal progress
- [x] Privacy controls: choose what friends can see (shelves, progress, ratings, goals)
- [x] Activity feed: "[Friend] finished [Book]" / "[Friend] started [Book]"
- [x] No messaging, no comments, no public profiles — intentionally minimal

**Deliverable:** Username-based friend system with read-only activity sharing.

---

## Phase 14 — "Because You Read…" Engine ✅
**Goal:** Book recommendations based on reading history — no AI, human-curated data.

- [x] "Because you read [Book A]" → suggested books (based on shared shelves across users, genre overlap, author connections)
- [x] Collaborative filtering: "Readers who rated [Book A] highly also rated [Book B] highly"
- [x] Genre affinity scoring: surface under-explored genres
- [x] Author discovery: "You've read 3 books by [Author] — here are their others"
- [x] Recommendation source transparency: always show _why_ a book is recommended
- [x] Dismissable recommendations ("Not interested" feeds back into model)
- [x] Cold-start handling: recommendations improve as library grows, graceful empty state

**Deliverable:** Data-driven book recommendations without AI dependency.

---

## Phase 15 — Differentiators (Ongoing)
**Goal:** The features that make Bookshelf exceptional.

### Animated Shelf & Cover Interactions
- [x] Cover tilt on hover (3D perspective)
- [ ] Shelf visual metaphor (bookshelf backdrop) (deferred — design-first)
- [x] Micro-interactions (scale, easing, confetti)
- [x] Layout transitions (filter/sort reflow via TransitionGroup FLIP)
- [x] `prefers-reduced-motion` respect

### Social Sharing & Reading Cards
- [x] Year-in-review shareable card
- [x] Monthly recap cards
- [x] Book review cards
- [x] Canvas API image generation (useShareCard composable)
- [x] Multiple templates, social media dimensions (square/story/landscape)
- [x] Preview and download (ShareCardModal + Web Share API)

### Goodreads Data Migration (Enhanced)
- [x] Full CSV parsing with all edge cases
- [x] Fuzzy match against book APIs
- [x] Import preview with conflict resolution
- [x] Progress indicator for large imports (estimated progress bar)
- [x] Import statistics dashboard (success rate, enrichment stats)

### Reading Statistics Dashboard (Enhanced)
- [x] Reading heatmap (GitHub contribution graph style)
- [x] Time-to-finish analysis (velocity endpoint + UI)
- [x] Page count distribution histogram
- [x] Rating patterns over time
- [x] Comparative stats (year over year comparison endpoint + UI)
- [x] Interactive charts (hover, click to filter)

### Accessibility-First
- [x] Full screen reader experience (ARIA landmarks, live regions)
- [x] High contrast mode (WCAG AAA)
- [x] Dyslexia-friendly font option
- [x] Customizable font size and line height
- [x] Skip links, logical heading hierarchy
- [x] Color-blind safe indicators
- [x] Keyboard workflow optimization
- [x] Accessibility statement page (/accessibility)

---

## Phase 16 — Polish & Performance
**Goal:** Production-ready quality.

- [ ] Lighthouse scores: Performance > 85, Accessibility > 90, Best Practices > 90
- [ ] Error handling audit (all API errors, edge cases)
- [ ] Loading/empty state audit (every view)
- [ ] Responsive audit (mobile → ultrawide)
- [ ] Cross-browser testing
- [ ] SEO meta tags, Open Graph tags
- [ ] Favicon + app icons
- [ ] README with screenshots, tech stack, Lighthouse scores
