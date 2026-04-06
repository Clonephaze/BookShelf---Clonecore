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
  // Appearance
  fontFamily: text('font_family').notNull().default('default'),
  accentColor: text('accent_color').notNull().default('copper'),
  readingComfort: boolean('reading_comfort').notNull().default(false),
  simpleShelfView: boolean('simple_shelf_view').notNull().default(false),
  // Privacy: what friends can see
  showShelves: boolean('show_shelves').notNull().default(true),
  showProgress: boolean('show_progress').notNull().default(true),
  showRatings: boolean('show_ratings').notNull().default(true),
  showGoals: boolean('show_goals').notNull().default(true),
  showActivity: boolean('show_activity').notNull().default(true),
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
  periodType: text('period_type').notNull().default('yearly'), // 'yearly' | 'monthly' | 'weekly'
  year: integer('year').notNull(),
  periodValue: integer('period_value').notNull().default(0), // 0 for yearly, 1-12 for monthly, 1-53 for weekly
  targetBooks: integer('target_books').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  unique('reading_goals_user_period_unique').on(table.userId, table.periodType, table.year, table.periodValue),
  index('reading_goals_user_id_idx').on(table.userId),
])

// ============================================
// Reading Sessions
// ============================================

export const readingSessions = pgTable('reading_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  userBookId: uuid('user_book_id').notNull().references(() => userBooks.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  timerMode: text('timer_mode').notNull().default('open'), // 'countdown' | 'open'
  timerDurationSeconds: integer('timer_duration_seconds'), // for countdown mode
  startPage: integer('start_page'),
  endPage: integer('end_page'),
  pagesRead: integer('pages_read'),
  status: text('status').notNull().default('active'), // 'active' | 'paused' | 'completed' | 'abandoned'
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('reading_sessions_user_id_idx').on(table.userId),
  index('reading_sessions_user_book_idx').on(table.userBookId),
  index('reading_sessions_user_active_idx').on(table.userId, table.status),
])

// ============================================
// Friends & Social
// ============================================

export const friendRequests = pgTable('friend_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromUserId: text('from_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  unique('friend_requests_pair_unique').on(table.fromUserId, table.toUserId),
  index('friend_requests_to_user_idx').on(table.toUserId, table.status),
  index('friend_requests_from_user_idx').on(table.fromUserId),
])

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  friendId: text('friend_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  unique('friendships_pair_unique').on(table.userId, table.friendId),
  index('friendships_user_idx').on(table.userId),
  index('friendships_friend_idx').on(table.friendId),
])

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'added_book' | 'started_reading' | 'finished_reading' | 'rated_book' | 'hit_goal'
  userBookId: uuid('user_book_id').references(() => userBooks.id, { onDelete: 'cascade' }),
  metadata: text('metadata'), // JSON string for extra context (e.g., rating value, goal target)
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('activity_log_user_idx').on(table.userId, table.createdAt),
  index('activity_log_created_idx').on(table.createdAt),
])
