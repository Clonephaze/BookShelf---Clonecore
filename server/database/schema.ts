import { pgTable, text, integer, boolean, timestamp, numeric, uuid, unique, index } from 'drizzle-orm/pg-core'

// ============================================
// Better Auth tables
// ============================================
// Better Auth manages these. We define them here so Drizzle
// is aware of them for relations and migrations.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  username: text('username').unique(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ============================================
// Bookshelf application tables
// ============================================

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('system'),
  defaultShelfId: uuid('default_shelf_id'),
  booksPerRow: integer('books_per_row'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const shelves = pgTable('shelves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  position: integer('position').notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
  icon: text('icon'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  unique('shelves_user_slug_unique').on(table.userId, table.slug),
  index('shelves_user_id_idx').on(table.userId),
])

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  additionalAuthors: text('additional_authors').array(),
  isbn13: text('isbn_13'),
  isbn10: text('isbn_10'),
  coverUrl: text('cover_url'),
  coverUrlSmall: text('cover_url_small'),
  pageCount: integer('page_count'),
  publishedDate: text('published_date'),
  genres: text('genres').array(),
  description: text('description'),
  publisher: text('publisher'),
  openLibraryKey: text('open_library_key'),
  googleBooksId: text('google_books_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('books_isbn13_idx').on(table.isbn13),
  index('books_isbn10_idx').on(table.isbn10),
  index('books_open_library_key_idx').on(table.openLibraryKey),
  index('books_google_books_id_idx').on(table.googleBooksId),
])

export const userBooks = pgTable('user_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  rating: integer('rating'),
  notes: text('notes'),
  currentPage: integer('current_page'),
  progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }),
  totalMinutes: integer('total_minutes'),
  currentMinutes: integer('current_minutes'),
  dateAdded: timestamp('date_added').notNull().defaultNow(),
  dateStarted: timestamp('date_started'),
  dateFinished: timestamp('date_finished'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  unique('user_books_user_book_unique').on(table.userId, table.bookId),
  index('user_books_user_id_idx').on(table.userId),
  index('user_books_user_finished_idx').on(table.userId, table.dateFinished),
  index('user_books_user_rating_idx').on(table.userId, table.rating),
])

export const userBookShelves = pgTable('user_book_shelves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userBookId: uuid('user_book_id').notNull().references(() => userBooks.id, { onDelete: 'cascade' }),
  shelfId: uuid('shelf_id').notNull().references(() => shelves.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').notNull().default(false),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (table) => [
  unique('user_book_shelves_unique').on(table.userBookId, table.shelfId),
  index('user_book_shelves_shelf_idx').on(table.shelfId),
])

export const readingProgressLog = pgTable('reading_progress_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userBookId: uuid('user_book_id').notNull().references(() => userBooks.id, { onDelete: 'cascade' }),
  pagesRead: integer('pages_read'),
  fromPage: integer('from_page'),
  toPage: integer('to_page'),
  minutesListened: integer('minutes_listened'),
  progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }),
  loggedAt: timestamp('logged_at').notNull().defaultNow(),
}, (table) => [
  index('progress_log_user_book_idx').on(table.userBookId, table.loggedAt),
])

export const readingGoals = pgTable('reading_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  targetBooks: integer('target_books').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  unique('reading_goals_user_year_unique').on(table.userId, table.year),
  index('reading_goals_user_id_idx').on(table.userId),
])
