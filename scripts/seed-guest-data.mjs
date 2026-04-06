/**
 * Guest data seed script.
 * Generates `public/guest-data.json` from `data/sample-books.json`
 * with shelf assignments, ratings, notes, dates, progress, goals, and stats.
 *
 * Run: node scripts/seed-guest-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const sampleBooks = JSON.parse(readFileSync(join(root, 'data/sample-books.json'), 'utf-8'))

// --- Helpers ---
function uuid() { return randomUUID() }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function daysAgo(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// --- Shelf definitions ---
const shelfDefs = [
  { name: 'Want to Read', slug: 'want-to-read', position: 0, isDefault: true, icon: 'bookmark' },
  { name: 'Currently Reading', slug: 'currently-reading', position: 1, isDefault: true, icon: 'book-open' },
  { name: 'Read', slug: 'read', position: 2, isDefault: true, icon: 'check-circle' },
  { name: 'Favorites', slug: 'favorites', position: 3, isDefault: false, icon: 'heart' },
  { name: 'Classics', slug: 'classics', position: 4, isDefault: false, icon: 'book' },
]

const shelves = shelfDefs.map(s => ({ id: uuid(), ...s, books: [], bookCount: 0 }))
const shelfMap = Object.fromEntries(shelves.map(s => [s.slug, s]))

// --- Book assignment ---
// Shuffle books for variety, then distribute
const shuffled = shuffle(sampleBooks.map((b, i) => ({ ...b, originalIndex: i })))

// Slice assignments: 15 Read, 5 Currently Reading, 15 Want to Read, ~10 unassigned to custom
const readBooks = shuffled.slice(0, 15)
const currentlyReading = shuffled.slice(15, 20)
const wantToRead = shuffled.slice(20, 35)
const remaining = shuffled.slice(35) // ~10 for custom shelves

// Also put some "Read" books in Favorites and Classics
const favoritesPicks = readBooks.slice(0, 5)
const classicsPicks = shuffled.filter(b => b.genres?.includes('Classics')).slice(0, 5)

// --- Sample notes ---
const sampleNotes = [
  'Couldn\'t put this down. The prose is beautiful.',
  'Slow start but the ending was worth it.',
  'Re-read material for sure. So many layers.',
  'Great audiobook narration too.',
  'Recommended by a friend — glad I picked it up.',
  'The world-building is incredible.',
  'Made me think about things differently.',
  'Perfect weekend read.',
  'Dense but rewarding. Took notes throughout.',
  'One of the best I\'ve read this year.',
]

// --- Build user books + shelf assignments ---
const allUserBooks = []
const year = new Date().getFullYear()

function makeSmallCover(coverUrl) {
  if (!coverUrl) return null
  return coverUrl.replace('-L.jpg', '-M.jpg')
}

// Read books (finished, with ratings and dates)
for (const book of readBooks) {
  const finishedDaysAgo = randomInt(14, 300)
  const startedDaysAgo = finishedDaysAgo + randomInt(5, 45)
  const rating = randomItem([3, 4, 4, 4, 5, 5, 5]) // skew positive
  const hasNotes = Math.random() > 0.5

  allUserBooks.push({
    userBookId: uuid(),
    bookId: uuid(),
    shelfSlug: 'read',
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl || null,
    coverUrlSmall: makeSmallCover(book.coverUrl),
    pageCount: book.pageCount || null,
    rating,
    notes: hasNotes ? randomItem(sampleNotes) : null,
    dateAdded: daysAgo(startedDaysAgo + randomInt(0, 10)),
    dateStarted: daysAgo(startedDaysAgo),
    dateFinished: daysAgo(finishedDaysAgo),
    currentPage: book.pageCount || null,
    progressPercent: '100.00',
    totalMinutes: null,
    currentMinutes: null,
    updatedAt: daysAgo(finishedDaysAgo),
    // Extra metadata for stats
    _genres: book.genres || [],
    _publishedDate: book.publishedDate || null,
    _isbn13: book.isbn13 || null,
  })
}

// Currently reading (partial progress)
for (const book of currentlyReading) {
  const pages = book.pageCount || 300
  const currentPage = randomInt(Math.floor(pages * 0.15), Math.floor(pages * 0.75))
  const progress = ((currentPage / pages) * 100).toFixed(2)
  const startedDaysAgo = randomInt(3, 21)

  allUserBooks.push({
    userBookId: uuid(),
    bookId: uuid(),
    shelfSlug: 'currently-reading',
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl || null,
    coverUrlSmall: makeSmallCover(book.coverUrl),
    pageCount: book.pageCount || null,
    rating: null,
    notes: null,
    dateAdded: daysAgo(startedDaysAgo + randomInt(1, 7)),
    dateStarted: daysAgo(startedDaysAgo),
    dateFinished: null,
    currentPage,
    progressPercent: progress,
    totalMinutes: null,
    currentMinutes: null,
    updatedAt: daysAgo(randomInt(0, 3)),
    _genres: book.genres || [],
    _publishedDate: book.publishedDate || null,
    _isbn13: book.isbn13 || null,
  })
}

// Want to Read (no progress, no rating)
for (const book of wantToRead) {
  allUserBooks.push({
    userBookId: uuid(),
    bookId: uuid(),
    shelfSlug: 'want-to-read',
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl || null,
    coverUrlSmall: makeSmallCover(book.coverUrl),
    pageCount: book.pageCount || null,
    rating: null,
    notes: null,
    dateAdded: daysAgo(randomInt(1, 180)),
    dateStarted: null,
    dateFinished: null,
    currentPage: null,
    progressPercent: null,
    totalMinutes: null,
    currentMinutes: null,
    updatedAt: daysAgo(randomInt(1, 30)),
    _genres: book.genres || [],
    _publishedDate: book.publishedDate || null,
    _isbn13: book.isbn13 || null,
  })
}

// Remaining books to Want to Read as well (so all 45 are assigned)
for (const book of remaining) {
  allUserBooks.push({
    userBookId: uuid(),
    bookId: uuid(),
    shelfSlug: 'want-to-read',
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl || null,
    coverUrlSmall: makeSmallCover(book.coverUrl),
    pageCount: book.pageCount || null,
    rating: null,
    notes: null,
    dateAdded: daysAgo(randomInt(1, 180)),
    dateStarted: null,
    dateFinished: null,
    currentPage: null,
    progressPercent: null,
    totalMinutes: null,
    currentMinutes: null,
    updatedAt: daysAgo(randomInt(1, 30)),
    _genres: book.genres || [],
    _publishedDate: book.publishedDate || null,
    _isbn13: book.isbn13 || null,
  })
}

// --- Build shelf data (matches ShelfData type) ---
for (const ub of allUserBooks) {
  const shelf = shelfMap[ub.shelfSlug]
  if (shelf) {
    shelf.books.push({
      userBookId: ub.userBookId,
      bookId: ub.bookId,
      title: ub.title,
      author: ub.author,
      coverUrl: ub.coverUrl,
      coverUrlSmall: ub.coverUrlSmall,
      pageCount: ub.pageCount,
      rating: ub.rating,
      dateAdded: ub.dateAdded,
      dateFinished: ub.dateFinished,
      currentPage: ub.currentPage,
      progressPercent: ub.progressPercent,
      totalMinutes: ub.totalMinutes,
      currentMinutes: ub.currentMinutes,
      updatedAt: ub.updatedAt,
    })
    shelf.bookCount = shelf.books.length
  }
}

// Add Favorites and Classics cross-assignments
for (const book of favoritesPicks) {
  const ub = allUserBooks.find(u => u.title === book.title)
  if (ub) {
    shelfMap['favorites'].books.push({
      userBookId: ub.userBookId,
      bookId: ub.bookId,
      title: ub.title,
      author: ub.author,
      coverUrl: ub.coverUrl,
      coverUrlSmall: ub.coverUrlSmall,
      pageCount: ub.pageCount,
      rating: ub.rating,
      dateAdded: ub.dateAdded,
      dateFinished: ub.dateFinished,
      currentPage: ub.currentPage,
      progressPercent: ub.progressPercent,
      totalMinutes: ub.totalMinutes,
      currentMinutes: ub.currentMinutes,
      updatedAt: ub.updatedAt,
    })
    shelfMap['favorites'].bookCount++
  }
}
for (const book of classicsPicks) {
  const ub = allUserBooks.find(u => u.title === book.title)
  if (ub && !shelfMap['classics'].books.find(b => b.userBookId === ub.userBookId)) {
    shelfMap['classics'].books.push({
      userBookId: ub.userBookId,
      bookId: ub.bookId,
      title: ub.title,
      author: ub.author,
      coverUrl: ub.coverUrl,
      coverUrlSmall: ub.coverUrlSmall,
      pageCount: ub.pageCount,
      rating: ub.rating,
      dateAdded: ub.dateAdded,
      dateFinished: ub.dateFinished,
      currentPage: ub.currentPage,
      progressPercent: ub.progressPercent,
      totalMinutes: ub.totalMinutes,
      currentMinutes: ub.currentMinutes,
      updatedAt: ub.updatedAt,
    })
    shelfMap['classics'].bookCount++
  }
}

// --- Build goals data ---
const finishedBooks = allUserBooks.filter(b => b.dateFinished)
const goals = [
  {
    id: uuid(),
    periodType: 'yearly',
    year,
    periodValue: year,
    targetBooks: 24,
    booksCompleted: finishedBooks.length,
    createdAt: `${year}-01-01`,
    updatedAt: daysAgo(0),
  },
]

// --- Build stats data ---

// Overview
const totalPages = finishedBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0)
const ratedBooks = finishedBooks.filter(b => b.rating)
const avgRating = ratedBooks.length
  ? Math.round((ratedBooks.reduce((s, b) => s + b.rating, 0) / ratedBooks.length) * 100) / 100
  : null
const avgPages = finishedBooks.length
  ? Math.round(totalPages / finishedBooks.length)
  : null

// Avg days to finish
const daysToFinish = finishedBooks
  .filter(b => b.dateAdded && b.dateFinished)
  .map(b => {
    const start = new Date(b.dateStarted || b.dateAdded)
    const end = new Date(b.dateFinished)
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
  })
const avgDaysToFinish = daysToFinish.length
  ? Math.round(daysToFinish.reduce((a, b) => a + b, 0) / daysToFinish.length)
  : null

// Sparkline (books per month this year)
const sparkline = Array(12).fill(0)
for (const b of finishedBooks) {
  const d = new Date(b.dateFinished)
  if (d.getFullYear() === year) {
    sparkline[d.getMonth()]++
  }
}

const overview = {
  totalBooks: finishedBooks.length,
  totalPages,
  avgRating,
  avgPages,
  avgDaysToFinish,
  booksThisYear: finishedBooks.filter(b => new Date(b.dateFinished).getFullYear() === year).length,
  currentYear: year,
  sparkline,
}

// Timeline (last 12 months)
const timelineMonths = 12
const timeline = []
const now = new Date()
for (let i = timelineMonths - 1; i >= 0; i--) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const count = finishedBooks.filter(b => {
    const fd = new Date(b.dateFinished)
    return fd.getFullYear() === y && fd.getMonth() + 1 === m
  }).length
  timeline.push({
    year: y,
    month: m,
    count,
    label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
  })
}

// Ratings distribution
const ratingDist = [1, 2, 3, 4, 5].map(star => ({
  rating: star,
  count: ratedBooks.filter(b => b.rating === star).length,
}))

// Highest rated author
const authorRatings = {}
for (const b of ratedBooks) {
  if (!authorRatings[b.author]) authorRatings[b.author] = { ratings: [], count: 0 }
  authorRatings[b.author].ratings.push(b.rating)
  authorRatings[b.author].count++
}
const topRatedAuthor = Object.entries(authorRatings)
  .map(([author, data]) => ({
    author,
    avgRating: Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 100) / 100,
    bookCount: data.count,
  }))
  .sort((a, b) => b.avgRating - a.avgRating || b.bookCount - a.bookCount)[0] || null

const ratings = {
  distribution: ratingDist,
  avgRating,
  totalRated: ratedBooks.length,
  totalBooks: finishedBooks.length,
  highestRatedAuthor: topRatedAuthor,
}

// Authors
const authorCounts = {}
for (const b of finishedBooks) {
  if (!authorCounts[b.author]) authorCounts[b.author] = { count: 0, coverUrlSmall: null }
  authorCounts[b.author].count++
  if (!authorCounts[b.author].coverUrlSmall && b.coverUrlSmall) {
    authorCounts[b.author].coverUrlSmall = b.coverUrlSmall
  }
}
const topAuthors = Object.entries(authorCounts)
  .map(([author, data]) => ({ author, bookCount: data.count, coverUrlSmall: data.coverUrlSmall }))
  .sort((a, b) => b.bookCount - a.bookCount)
  .slice(0, 10)

const uniqueAuthors = new Set(finishedBooks.map(b => b.author)).size
const repeatAuthors = Object.values(authorCounts).filter(a => a.count > 1).length

const authors = {
  uniqueAuthors,
  totalBooks: finishedBooks.length,
  repeatAuthors,
  topAuthors,
}

// Pages distribution
const pageBuckets = [
  { bucket: 'Under 200', min: 0, max: 199 },
  { bucket: '200–399', min: 200, max: 399 },
  { bucket: '400–599', min: 400, max: 599 },
  { bucket: '600+', min: 600, max: Infinity },
]
const booksWithPages = finishedBooks.filter(b => b.pageCount)
const pagesDistribution = pageBuckets.map(({ bucket, min, max }) => ({
  bucket,
  count: booksWithPages.filter(b => b.pageCount >= min && b.pageCount <= max).length,
}))
const sortedByPages = [...booksWithPages].sort((a, b) => a.pageCount - b.pageCount)
const shortest = sortedByPages[0]
  ? { title: sortedByPages[0].title, author: sortedByPages[0].author, pageCount: sortedByPages[0].pageCount, coverUrlSmall: sortedByPages[0].coverUrlSmall }
  : null
const longest = sortedByPages.length
  ? { title: sortedByPages.at(-1).title, author: sortedByPages.at(-1).author, pageCount: sortedByPages.at(-1).pageCount, coverUrlSmall: sortedByPages.at(-1).coverUrlSmall }
  : null

const pages = { distribution: pagesDistribution, shortest, longest }

// Heatmap
const heatmapDays = {}
for (const b of finishedBooks) {
  const d = new Date(b.dateFinished)
  if (d.getFullYear() === year) {
    const key = b.dateFinished
    heatmapDays[key] = (heatmapDays[key] || 0) + 1
  }
}

const heatmap = { year, days: heatmapDays }

// --- Assemble final payload ---
const guestData = {
  library: shelves.map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    position: s.position,
    isDefault: s.isDefault,
    icon: s.icon,
    books: s.books,
    bookCount: s.bookCount,
  })),
  goals,
  stats: {
    overview,
    timeline: { timeline, months: timelineMonths },
    ratings,
    authors,
    pages,
    heatmap,
  },
  // Full book details for detail panel (keyed by userBookId)
  bookDetails: Object.fromEntries(allUserBooks.map(b => [b.userBookId, {
    id: b.userBookId,
    bookId: b.bookId,
    title: b.title,
    author: b.author,
    coverUrl: b.coverUrl,
    coverUrlSmall: b.coverUrlSmall,
    pageCount: b.pageCount,
    rating: b.rating,
    notes: b.notes,
    dateAdded: b.dateAdded,
    dateStarted: b.dateStarted,
    dateFinished: b.dateFinished,
    currentPage: b.currentPage,
    progressPercent: b.progressPercent,
    totalMinutes: b.totalMinutes,
    currentMinutes: b.currentMinutes,
    genres: b._genres,
    publishedDate: b._publishedDate,
    isbn13: b._isbn13,
  }])),
}

// Write output to both public (optional client use) and server/assets (Nitro bundled)
const output = JSON.stringify(guestData, null, 2)
mkdirSync(join(root, 'public'), { recursive: true })
mkdirSync(join(root, 'server/assets'), { recursive: true })
writeFileSync(join(root, 'public/guest-data.json'), output)
writeFileSync(join(root, 'server/assets/guest-data.json'), output)

console.log('✓ Generated guest-data.json (public/ + server/assets/)')
console.log(`  ${allUserBooks.length} books across ${shelves.length} shelves`)
console.log(`  ${finishedBooks.length} finished, ${currentlyReading.length} in progress, ${wantToRead.length + remaining.length} want to read`)
console.log(`  Goals: ${goals[0].targetBooks} target / ${goals[0].booksCompleted} complete`)
console.log(`  Stats: ${overview.totalBooks} books, ${overview.totalPages} pages, ${overview.avgRating} avg rating`)
