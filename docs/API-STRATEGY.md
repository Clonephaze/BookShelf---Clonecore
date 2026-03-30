# Book API Integration Strategy

## Dual-API Approach

Bookshelf uses **Open Library** as the primary API and **Google Books** as an enrichment/fallback layer. All API calls are proxied through Nuxt server routes — no direct client-to-API calls.

## API Profiles

### Open Library

| Attribute | Details |
|-----------|---------|
| **Base URL** | `https://openlibrary.org` |
| **Auth** | None required |
| **Rate limit** | ~1 req/sec sustained (courtesy limit, not enforced hard) |
| **Covers** | `https://covers.openlibrary.org/b/isbn/{isbn}-{size}.jpg` (S/M/L) |
| **Strengths** | Huge catalog, no API key, good cover availability, edition-level data |
| **Weaknesses** | Inconsistent metadata, slow responses (~1-3s), messy subject/genre data |

**Key endpoints:**
- Search: `GET /search.json?q={query}&limit=20`
- Search by title: `GET /search.json?title={title}`
- Search by author: `GET /search.json?author={author}`
- Search by ISBN: `GET /isbn/{isbn}.json`
- Work details: `GET /works/{key}.json`
- Cover image: `GET https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg`

### Google Books

| Attribute | Details |
|-----------|---------|
| **Base URL** | `https://www.googleapis.com/books/v1` |
| **Auth** | API key required (free, 1000 requests/day default) |
| **Rate limit** | 1000/day free tier, can request increase |
| **Strengths** | Better descriptions, more consistent metadata, better for popular books |
| **Weaknesses** | Daily quota, requires API key, less comprehensive catalog for obscure titles |

**Key endpoints:**
- Search: `GET /volumes?q={query}&maxResults=20&key={key}`
- Search by ISBN: `GET /volumes?q=isbn:{isbn}&key={key}`
- Volume details: `GET /volumes/{id}?key={key}`

## Unified Interface

Both APIs are normalized to a common `BookSearchResult` type:

```typescript
interface BookSearchResult {
  title: string
  authors: string[]
  isbn13: string | null
  isbn10: string | null
  coverUrl: string | null
  coverUrlSmall: string | null
  pageCount: number | null
  publishedDate: string | null
  genres: string[]
  description: string | null
  publisher: string | null
  openLibraryKey: string | null
  googleBooksId: string | null
}
```

## Search Strategy

### For user-initiated search:
1. **Fire both APIs in parallel** (Open Library + Google Books)
2. **Merge & deduplicate** results by ISBN match (ISBN-13 preferred, fall back to ISBN-10)
3. **Prefer the richer record** — for each matched pair, take the better cover, longer description, more complete metadata from whichever API provides it
4. **Rank results** — exact matches first, then relevance, then API source (Google Books results rank slightly higher for metadata quality)
5. **Return unified results** to the client

### For ISBN lookup (e.g., adding from Goodreads import):
1. Try Open Library ISBN endpoint first (no rate limit concern for single requests)
2. If not found or missing key data, try Google Books
3. Merge what you get

### For enrichment (filling in gaps after initial add):
- If a book in the DB is missing cover/description/page count, a background job can query the other API to fill gaps
- Not real-time — triggered periodically or on book detail view

## Caching Strategy

### Server-side (Nitro cache)
- **Search results**: Cache for 1 hour, keyed by normalized query string
- **Book details by ISBN**: Cache for 24 hours (metadata doesn't change often)
- **Cover URL validation**: Cache cover URL existence for 7 days

### Database-level
- Once a book is added to the `books` table, it's our source of truth
- API is only queried for: new searches, enrichment of incomplete records, fresh cover URLs
- A `books.updated_at` check can trigger re-enrichment if older than 30 days

## Rate Limiting

### Open Library
- Implement a request queue with 1 req/sec throttle for sustained operations (e.g., Goodreads import enrichment)
- Single search requests are fine without throttling
- Include a polite `User-Agent` header

### Google Books
- Track daily usage against the 1000/day quota
- Google Books is the secondary source — only used for enrichment and parallel search
- If quota is near limit, skip Google Books enrichment and rely on Open Library alone

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Open Library down (5xx) | Fall back to Google Books only |
| Google Books quota exceeded (429) | Fall back to Open Library only |
| Both APIs down | Show cached results if available; show error state if not |
| Timeout (>5s) | Cancel slow API, use results from whichever responded |
| Malformed response | Log, skip that API's results, use the other |
| No results from either | Show "No books found" with search suggestions |
| Missing cover URL | Generate placeholder with title + author text |

## Cover Image Pipeline

Book covers follow this resolution order:
1. Open Library cover URL (`covers.openlibrary.org/b/isbn/{isbn}-L.jpg`)
2. Google Books thumbnail URL (from API response `imageLinks.thumbnail`)
3. Styled placeholder (CSS-generated with title + author in brand typography)

Cover images are loaded lazily with:
- `loading="lazy"` attribute
- Skeleton placeholder during load (2:3 aspect ratio)
- `@error` handler that swaps to styled placeholder
- Small size (`-S.jpg`) for grids, large size (`-L.jpg`) for detail view

## Data Quality Normalization

| Issue | Resolution |
|-------|------------|
| Author format inconsistency | Normalize to "First Last" format; store original in metadata |
| HTML entities in descriptions | Strip HTML, decode entities, store as plaintext |
| Nested/messy genres (Open Library) | Map to a controlled genre list (~15-20 canonical genres) |
| Duplicate editions in search | Group by work ID (Open Library) or deduplicate by ISBN |
| Missing page count | Store as `null`, UI falls back to percentage-based progress |
| Varied date formats | Store as-is in text field, parse for display |
