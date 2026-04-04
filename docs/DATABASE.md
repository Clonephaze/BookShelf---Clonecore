# Database Schema

PostgreSQL via Neon, managed with Drizzle ORM.

## Entity Relationship Overview

```
users ──< user_books ──< reading_progress_log
  │           │
  │           ├── user_book_shelves >── shelves
  │           │
  │           ├── ratings
  │           └── notes
  │
  ├──< shelves
  ├──< reading_goals
  └──< user_preferences
```

## Tables

### `users`

Managed by Better Auth. Better Auth creates its own `user`, `session`, `account`, and `verification` tables. We extend with a `user_preferences` table.

### `user_preferences`

User-level settings — theme, display, defaults.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `text` FK → `user.id` | Unique, one per user |
| `theme` | `text` | `'light'`, `'dark'`, `'oled'`, `'system'` |
| `default_shelf_id` | `uuid` FK → `shelves.id` | Nullable, shelf to add new books to |
| `books_per_row` | `integer` | Nullable, display preference |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

### `shelves`

User's book shelves. Three defaults + unlimited custom.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `text` FK → `user.id` | |
| `name` | `text` | e.g., "Want to Read", "Favorites" |
| `slug` | `text` | URL-friendly: `want-to-read`, `favorites` |
| `position` | `integer` | Display order |
| `is_default` | `boolean` | `true` for the 3 default shelves, prevents deletion |
| `icon` | `text` | Nullable, Lucide icon name |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Unique constraint:** `(user_id, slug)` — no duplicate shelf names per user.

**Default shelves** (seeded on account creation):
1. "Want to Read" (`want-to-read`, position 0)
2. "Currently Reading" (`currently-reading`, position 1)
3. "Read" (`read`, position 2)

### `books`

Canonical book records. Shared across users — when two users add the same ISBN, they reference the same `books` row. Metadata sourced from Open Library / Google Books.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `title` | `text` | |
| `author` | `text` | Primary author, display format ("Frank Herbert") |
| `additional_authors` | `text[]` | Nullable, array of co-authors |
| `isbn13` | `text` | Nullable, indexed |
| `isbn10` | `text` | Nullable, indexed |
| `cover_url` | `text` | Nullable, full URL to cover image |
| `cover_url_small` | `text` | Nullable, thumbnail URL |
| `page_count` | `integer` | Nullable (some books lack this) |
| `published_date` | `text` | Year or full date string, nullable |
| `genres` | `text[]` | Array of genre/subject tags |
| `description` | `text` | Nullable, sanitized plaintext |
| `publisher` | `text` | Nullable |
| `open_library_key` | `text` | Nullable, Open Library work/edition key |
| `google_books_id` | `text` | Nullable, Google Books volume ID |
| `created_at` | `timestamp` | When first added to our system |
| `updated_at` | `timestamp` | Last metadata refresh |

**Unique indexes:**
- `isbn13` (where not null)
- `isbn10` (where not null)
- `open_library_key` (where not null)
- `google_books_id` (where not null)

**Deduplication strategy:** When adding a book, check in order: ISBN-13, ISBN-10, Open Library key, Google Books ID. If a match exists, reuse that `books` row. If no identifier matches, create a new row (title+author alone isn't reliable for dedup).

### `user_books`

Junction table linking a user's library to books. One row = "this user has this book."

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `text` FK → `user.id` | |
| `book_id` | `uuid` FK → `books.id` | |
| `rating` | `integer` | Nullable, 1-5 |
| `notes` | `text` | Nullable, personal notes (markdown) |
| `current_page` | `integer` | Nullable, reading progress |
| `progress_percent` | `numeric(5,2)` | Nullable, 0.00-100.00 (fallback when no page count) |
| `date_added` | `timestamp` | When user added to library |
| `date_started` | `timestamp` | Nullable, when started reading |
| `date_finished` | `timestamp` | Nullable, when finished |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Unique constraint:** `(user_id, book_id)` — a user can't add the same book twice.

**Indexes:**
- `(user_id)` — fetch a user's library
- `(user_id, date_finished)` — stats queries (books finished per month)
- `(user_id, rating)` — filter by rating

### `user_book_shelves`

Which shelf a book is on. A book belongs to **exactly one** primary shelf but can also be on additional custom shelves (e.g., "Favorites" as a secondary tag-shelf).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_book_id` | `uuid` FK → `user_books.id` | |
| `shelf_id` | `uuid` FK → `shelves.id` | |
| `is_primary` | `boolean` | Exactly one primary shelf per user_book |
| `added_at` | `timestamp` | When placed on this shelf |

**Unique constraint:** `(user_book_id, shelf_id)` — can't put same book on same shelf twice.

**Constraint:** Exactly one row with `is_primary = true` per `user_book_id` (enforced in application logic + DB trigger or check).

### `reading_progress_log`

Historical reading progress entries. The `user_books.current_page` holds the latest state; this table holds the history for stats (pages per day, reading pace, heatmaps).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_book_id` | `uuid` FK → `user_books.id` | |
| `pages_read` | `integer` | Pages read in this session (delta) |
| `from_page` | `integer` | Nullable, page started at |
| `to_page` | `integer` | Nullable, page ended at |
| `progress_percent` | `numeric(5,2)` | Snapshot of progress at this point |
| `logged_at` | `timestamp` | When this progress was logged |

**Index:** `(user_book_id, logged_at)` — timeline queries per book.

### `reading_goals`

Annual reading goals.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `text` FK → `user.id` | |
| `year` | `integer` | Goal year (e.g., 2026) |
| `target_books` | `integer` | Number of books to read |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

**Unique constraint:** `(user_id, year)` — one goal per year.

**Completion is computed**, not stored — count `user_books` where `date_finished` falls within the goal year.

## Guest Data Strategy

Guest session does **not** touch the database. Guest data is served from a pre-built JSON payload derived from `data/sample-books.json` with hardcoded shelf assignments, progress, ratings, notes, and stats. This payload is shaped to match the same TypeScript types the real API returns, so components are agnostic.

The guest JSON is generated at build time from a seed script and served as a static asset or from a server route.

## Migration Strategy

Drizzle Kit handles migrations:
- `drizzle-kit generate` — generates SQL migration files from schema changes
- `drizzle-kit migrate` — applies pending migrations
- Migration files committed to `server/database/migrations/`

## Performance Considerations

- **Indexes** on all FK columns and common query patterns (user_id, shelf_id, date_finished)
- **Pagination** for shelf views (cursor-based, keyed on `date_added` or `position`)
- **Partial indexes** on `isbn13 WHERE isbn13 IS NOT NULL` to avoid indexing nulls
- **Connection pooling** via Neon's serverless driver (`@neondatabase/serverless`) — critical for Vercel's serverless functions
