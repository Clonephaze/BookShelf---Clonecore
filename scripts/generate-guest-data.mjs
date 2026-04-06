/**
 * Generate guest-data.json with popular/recent books.
 * Run: node scripts/generate-guest-data.mjs
 */
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

// Helper to build cover URLs
const isbnCover = (isbn, size) => `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`
const olidCover = (olid, size) => `https://covers.openlibrary.org/b/olid/${olid}-${size}.jpg`

// ---- Book catalog (all verified covers) ----
const catalog = [
  // Read (15) - finished, rated
  { title: 'The Midnight Library', author: 'Matt Haig', isbn: '9780593321201', pages: 288, year: '2020', genres: ['Fiction', 'Fantasy'] },
  { title: 'Project Hail Mary', author: 'Andy Weir', isbn: '9780593135204', pages: 496, year: '2021', genres: ['Sci-Fi', 'Adventure'] },
  { title: 'Circe', author: 'Madeline Miller', isbn: '9780316556347', pages: 400, year: '2018', genres: ['Fantasy', 'Mythology'] },
  { title: 'Lessons in Chemistry', author: 'Bonnie Garmus', isbn: '9780385551151', pages: 400, year: '2022', genres: ['Fiction', 'Historical Fiction'] },
  { title: 'Where the Crawdads Sing', author: 'Delia Owens', isbn: '9780062060624', pages: 384, year: '2018', genres: ['Fiction', 'Mystery'] },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', pages: 662, year: '2007', genres: ['Fantasy', 'Epic Fantasy'] },
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', pages: 688, year: '1965', genres: ['Sci-Fi', 'Classic'] },
  { title: 'Normal People', author: 'Sally Rooney', isbn: '9781984822185', pages: 288, year: '2018', genres: ['Fiction', 'Romance'] },
  { title: 'A Gentleman in Moscow', author: 'Amor Towles', isbn: '9780143110439', pages: 462, year: '2016', genres: ['Fiction', 'Historical Fiction'] },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', pages: 336, year: '1960', genres: ['Fiction', 'Classic'] },
  { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007', pages: 197, year: '1988', genres: ['Fiction', 'Philosophy'] },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', pages: 320, year: '2018', genres: ['Non-Fiction', 'Self-Improvement'] },
  { title: 'Babel', author: 'R.F. Kuang', isbn: '9780593230572', pages: 560, year: '2022', genres: ['Fantasy', 'Historical Fantasy'] },
  { title: 'Funny Story', author: 'Emily Henry', isbn: '9780593441220', pages: 400, year: '2024', genres: ['Fiction', 'Romance'] },
  { title: 'Divergent', author: 'Veronica Roth', isbn: '9780062024039', pages: 487, year: '2011', genres: ['Sci-Fi', 'Dystopian'] },

  // Currently Reading (5) - with progress
  { title: 'He Who Fights with Monsters', author: 'Shirtaloon', olid: 'OL32614650M', pages: 678, year: '2021', genres: ['Fantasy', 'LitRPG'] },
  { title: 'The Way of Kings', author: 'Brandon Sanderson', isbn: '9781399622066', pages: 1007, year: '2010', genres: ['Fantasy', 'Epic Fantasy'] },
  { title: 'Dungeon Crawler Carl', author: 'Matt Dinniman', isbn: '9780593820247', pages: 465, year: '2020', genres: ['Fantasy', 'LitRPG'] },
  { title: 'Legends & Lattes', author: 'Travis Baldree', isbn: '9780593438589', pages: 296, year: '2022', genres: ['Fantasy', 'Cozy Fantasy'] },
  { title: 'The Women', author: 'Kristin Hannah', isbn: '9781250178633', pages: 480, year: '2024', genres: ['Fiction', 'Historical Fiction'] },

  // Want to Read (15)
  { title: 'House of Flame and Shadow', author: 'Sarah J. Maas', isbn: '9781408884447', pages: 848, year: '2024', genres: ['Fantasy', 'Romantasy'] },
  { title: 'A Court of Thorns and Roses', author: 'Sarah J. Maas', isbn: '9781635577020', pages: 432, year: '2015', genres: ['Fantasy', 'Romantasy'] },
  { title: 'Happy Place', author: 'Emily Henry', isbn: '9780593441275', pages: 400, year: '2023', genres: ['Fiction', 'Romance'] },
  { title: 'The Vanishing Half', author: 'Brit Bennett', isbn: '9780525559474', pages: 352, year: '2020', genres: ['Fiction', 'Literary Fiction'] },
  { title: 'Sunrise on the Reaping', author: 'Suzanne Collins', isbn: '9781761641176', pages: 400, year: '2025', genres: ['Sci-Fi', 'Dystopian'] },
  { title: 'Red Rising', author: 'Pierce Brown', isbn: '9780316452465', pages: 400, year: '2014', genres: ['Sci-Fi', 'Space Opera'] },
  { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', isbn: '9780765326355', pages: 672, year: '2006', genres: ['Fantasy', 'Epic Fantasy'] },
  { title: 'Born a Crime', author: 'Trevor Noah', isbn: '9780399588174', pages: 304, year: '2016', genres: ['Non-Fiction', 'Memoir'] },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', pages: 352, year: '2018', genres: ['Non-Fiction', 'Memoir'] },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', pages: 464, year: '2011', genres: ['Non-Fiction', 'History'] },
  { title: '1984', author: 'George Orwell', isbn: '9780451524935', pages: 328, year: '1949', genres: ['Fiction', 'Dystopian'] },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', pages: 180, year: '1925', genres: ['Fiction', 'Classic'] },
  { title: 'Slaughterhouse-Five', author: 'Kurt Vonnegut', isbn: '9780385333481', pages: 275, year: '1969', genres: ['Fiction', 'Sci-Fi'] },
  { title: 'The Atlas Six', author: 'Olivie Blake', isbn: '9780593334836', pages: 384, year: '2022', genres: ['Fantasy', 'Dark Academia'] },
  { title: 'The Library Book', author: 'Susan Orlean', isbn: '9780062457714', pages: 317, year: '2018', genres: ['Non-Fiction', 'History'] },
]

function coverL(book) {
  return book.olid ? olidCover(book.olid, 'L') : isbnCover(book.isbn, 'L')
}
function coverM(book) {
  return book.olid ? olidCover(book.olid, 'M') : isbnCover(book.isbn, 'M')
}

// ---- Assign books to shelves ----
const readBooks = catalog.slice(0, 15)
const currentlyReading = catalog.slice(15, 20)
const wantToRead = catalog.slice(20, 35)

// Favorites = subset of Read (the best ones)
const favoriteIndices = [1, 2, 5, 6, 12] // Project Hail Mary, Circe, Name of the Wind, Dune, Babel
const favoriteBooks = favoriteIndices.map(i => readBooks[i])

// Fantasy Shelf = cross-shelf fantasy picks
const fantasyPicks = [readBooks[5], readBooks[6], readBooks[12], currentlyReading[1], currentlyReading[2]]

// ---- Generate IDs ----
const bookIds = new Map()
catalog.forEach(b => bookIds.set(b.title, randomUUID()))

const userBookIds = new Map()
catalog.forEach(b => userBookIds.set(b.title, randomUUID()))

// ---- Date generation helpers ----
function randomDate(start, end) {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return new Date(s + Math.random() * (e - s)).toISOString().slice(0, 10)
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Notes pool
const notes = [
  'Couldn\'t put this down. Finished in a weekend.',
  'Beautiful prose. Will definitely re-read someday.',
  'The world-building is incredible.',
  'Made me think about things differently.',
  'Took notes throughout. So many quotable lines.',
  'Started slow but the ending was worth it.',
  'Recommended by a friend — glad I picked it up.',
  'The characters felt so real.',
  'Perfect weekend read.',
  'One of the best I\'ve read this year.',
  'The plot twists caught me completely off guard.',
  'Loved the atmosphere and setting.',
  'A masterclass in storytelling.',
  'Re-read this after watching the adaptation.',
  'The magic system is so creative.',
]

// Ratings for Read books (mostly 4-5, a few 3s)
const readRatings = [5, 5, 5, 4, 4, 5, 5, 4, 4, 5, 4, 4, 5, 4, 3]

// ---- Build library shelf entries ----
function makeShelfBook(book, opts = {}) {
  const { rating, notes: n, dateAdded, dateStarted, dateFinished, currentPage, progressPercent } = opts
  return {
    userBookId: userBookIds.get(book.title),
    bookId: bookIds.get(book.title),
    title: book.title,
    author: book.author,
    coverUrl: coverL(book),
    coverUrlSmall: coverM(book),
    pageCount: book.pages,
    rating: rating ?? null,
    dateAdded: dateAdded ?? null,
    dateFinished: dateFinished ?? null,
    currentPage: currentPage ?? null,
    progressPercent: progressPercent ?? null,
    totalMinutes: null,
    currentMinutes: null,
    updatedAt: dateFinished ?? dateAdded ?? '2026-04-01',
  }
}

// Read books — each finished with rating, notes, dates
const readShelfBooks = readBooks.map((book, i) => {
  const dateAdded = randomDate('2025-06-01', '2026-01-15')
  const dateStarted = addDays(dateAdded, Math.floor(Math.random() * 7) + 1)
  const daysToRead = Math.floor(Math.random() * 25) + 5
  const dateFinished = addDays(dateStarted, daysToRead)
  return makeShelfBook(book, {
    rating: readRatings[i],
    dateAdded,
    dateFinished,
    currentPage: book.pages,
    progressPercent: '100.00',
  })
})

// Currently Reading — partial progress
const progressData = [
  { pct: 45, pageMult: 0.45 }, // HWFWM
  { pct: 22, pageMult: 0.22 }, // Way of Kings
  { pct: 68, pageMult: 0.68 }, // DCC
  { pct: 55, pageMult: 0.55 }, // Legends & Lattes
  { pct: 35, pageMult: 0.35 }, // The Women
]
const currentShelfBooks = currentlyReading.map((book, i) => {
  const dateAdded = randomDate('2026-02-01', '2026-03-15')
  const currentPage = Math.round(book.pages * progressData[i].pageMult)
  return makeShelfBook(book, {
    dateAdded,
    currentPage,
    progressPercent: progressData[i].pct.toFixed(2),
  })
})

// Want to Read — no progress
const wantShelfBooks = wantToRead.map(book => {
  const dateAdded = randomDate('2026-01-01', '2026-04-01')
  return makeShelfBook(book, { dateAdded })
})

// Favorites — reference same books from Read
const favShelfBooks = favoriteBooks.map(book => {
  const readEntry = readShelfBooks.find(rb => rb.title === book.title)
  return { ...readEntry }
})

// Fantasy shelf
const fantasyShelfBooks = fantasyPicks.map(book => {
  const existing = [...readShelfBooks, ...currentShelfBooks].find(b => b.title === book.title)
  return { ...existing }
})

// ---- Build library ----
const library = [
  {
    id: randomUUID(),
    name: 'Want to Read',
    slug: 'want-to-read',
    position: 0,
    isDefault: true,
    icon: 'bookmark',
    books: wantShelfBooks,
  },
  {
    id: randomUUID(),
    name: 'Currently Reading',
    slug: 'currently-reading',
    position: 1,
    isDefault: true,
    icon: 'book-open',
    books: currentShelfBooks,
  },
  {
    id: randomUUID(),
    name: 'Read',
    slug: 'read',
    position: 2,
    isDefault: true,
    icon: 'check-circle',
    books: readShelfBooks,
  },
  {
    id: randomUUID(),
    name: 'Favorites',
    slug: 'favorites',
    position: 3,
    isDefault: false,
    icon: 'heart',
    books: favShelfBooks,
  },
  {
    id: randomUUID(),
    name: 'Fantasy Picks',
    slug: 'fantasy-picks',
    position: 4,
    isDefault: false,
    icon: 'sparkles',
    books: fantasyShelfBooks,
  },
]

// ---- Build goals ----
const goals = {
  id: randomUUID(),
  periodType: 'yearly',
  year: 2026,
  periodValue: 2026,
  targetBooks: 24,
  booksCompleted: 15,
  createdAt: '2026-01-01',
  updatedAt: '2026-04-05',
}

// ---- Build stats ----
// Derive from Read shelf
const totalPages = readBooks.reduce((sum, b) => sum + b.pages, 0)
const avgRating = +(readRatings.reduce((s, r) => s + r, 0) / readRatings.length).toFixed(2)

// Parse finish dates to build timeline
const finishDates = readShelfBooks.map(b => b.dateFinished).sort()
const monthCounts = {}
finishDates.forEach(d => {
  const [y, m] = d.split('-')
  const key = `${y}-${m}`
  monthCounts[key] = (monthCounts[key] || 0) + 1
})

// Build 12-month timeline
const timeline = []
const sparkline = []
for (let i = 0; i < 12; i++) {
  const date = new Date(2025, 4 + i, 1) // Start from May 2025
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const key = `${y}-${String(m).padStart(2, '0')}`
  const count = monthCounts[key] || 0
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  timeline.push({
    year: y,
    month: m,
    count,
    label: `${monthNames[m - 1]} ${String(y).slice(2)}`,
  })
  sparkline.push(count)
}

// Rating distribution
const ratingDist = [1, 2, 3, 4, 5].map(r => ({
  rating: r,
  count: readRatings.filter(x => x === r).length,
}))

// Find highest rated author
const authorRatings = {}
readBooks.forEach((b, i) => {
  if (!authorRatings[b.author]) authorRatings[b.author] = { total: 0, count: 0 }
  authorRatings[b.author].total += readRatings[i]
  authorRatings[b.author].count++
})
const topAuthor = Object.entries(authorRatings)
  .map(([author, { total, count }]) => ({ author, avgRating: +(total / count).toFixed(1), bookCount: count }))
  .sort((a, b) => b.avgRating - a.avgRating)[0]

// Page distribution
const pageBuckets = [
  { bucket: 'Under 200', count: readBooks.filter(b => b.pages < 200).length },
  { bucket: '200–399', count: readBooks.filter(b => b.pages >= 200 && b.pages < 400).length },
  { bucket: '400–599', count: readBooks.filter(b => b.pages >= 400 && b.pages < 600).length },
  { bucket: '600+', count: readBooks.filter(b => b.pages >= 600).length },
]

const shortest = readBooks.reduce((a, b) => a.pages < b.pages ? a : b)
const longest = readBooks.reduce((a, b) => a.pages > b.pages ? a : b)

// Top authors for stats
const topAuthors = readBooks.map((b, i) => ({
  author: b.author,
  bookCount: 1,
  coverUrlSmall: coverM(b),
}))

// Heatmap - reading activity days in 2026
const heatmapDays = {}
readShelfBooks.forEach(b => {
  if (b.dateFinished && b.dateFinished.startsWith('2026')) {
    heatmapDays[b.dateFinished] = (heatmapDays[b.dateFinished] || 0) + 1
  }
})
// Add some reading activity days
currentShelfBooks.forEach(b => {
  if (b.dateAdded && b.dateAdded.startsWith('2026')) {
    const startDate = new Date(b.dateAdded)
    for (let d = 0; d < 5; d++) {
      const activityDate = addDays(b.dateAdded, d * 3 + Math.floor(Math.random() * 3))
      if (activityDate.startsWith('2026')) {
        heatmapDays[activityDate] = (heatmapDays[activityDate] || 0) + 1
      }
    }
  }
})

const booksThisYear = readShelfBooks.filter(b => b.dateFinished?.startsWith('2026')).length

const stats = {
  overview: {
    totalBooks: 15,
    totalPages,
    avgRating,
    avgPages: Math.round(totalPages / 15),
    avgDaysToFinish: 18,
    booksThisYear,
    currentYear: 2026,
    sparkline,
  },
  ratings: {
    distribution: ratingDist,
    avgRating,
    totalRated: 15,
    totalBooks: 15,
    highestRatedAuthor: topAuthor,
  },
  timeline: { timeline, months: 12 },
  pages: {
    distribution: pageBuckets,
    shortest: { title: shortest.title, author: shortest.author, pageCount: shortest.pages, coverUrlSmall: coverM(shortest) },
    longest: { title: longest.title, author: longest.author, pageCount: longest.pages, coverUrlSmall: coverM(longest) },
  },
  heatmap: { year: 2026, days: heatmapDays },
  authors: {
    uniqueAuthors: 15,
    totalBooks: 15,
    repeatAuthors: 0,
    topAuthors,
  },
}

// ---- Build bookDetails ----
const bookDetails = {}
const allBooks = [...readBooks, ...currentlyReading, ...wantToRead]
const allShelfBooks = [...readShelfBooks, ...currentShelfBooks, ...wantShelfBooks]

allBooks.forEach((book, i) => {
  const shelfBook = allShelfBooks[i]
  const isRead = i < 15
  const isCurrent = i >= 15 && i < 20
  const dateAdded = shelfBook.dateAdded
  const dateStarted = isRead ? addDays(dateAdded, Math.floor(Math.random() * 5) + 1) : (isCurrent ? addDays(dateAdded, 2) : null)

  bookDetails[shelfBook.userBookId] = {
    id: shelfBook.userBookId,
    bookId: bookIds.get(book.title),
    title: book.title,
    author: book.author,
    coverUrl: coverL(book),
    coverUrlSmall: coverM(book),
    pageCount: book.pages,
    rating: shelfBook.rating,
    notes: isRead ? notes[i % notes.length] : null,
    dateAdded,
    dateStarted,
    dateFinished: shelfBook.dateFinished ?? null,
    currentPage: shelfBook.currentPage,
    progressPercent: shelfBook.progressPercent,
    totalMinutes: null,
    currentMinutes: null,
    genres: book.genres,
    publishedDate: book.year,
    isbn13: book.isbn ?? null,
  }
})

// ---- Write output ----
const guestData = { library, goals, stats, bookDetails }
const outPath = new URL('../server/assets/guest-data.json', import.meta.url)
writeFileSync(outPath, JSON.stringify(guestData, null, 2))
console.log(`✅ Generated guest-data.json (${Object.keys(bookDetails).length} books across ${library.length} shelves)`)
