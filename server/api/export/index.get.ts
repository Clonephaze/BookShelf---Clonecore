import { eq, sql } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books, shelves, userBookShelves } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const query = getQuery(event)
  const format = String(query.format || 'json').toLowerCase()

  if (format !== 'json' && format !== 'csv') {
    throw createError({ statusCode: 400, statusMessage: 'Format must be "json" or "csv".' })
  }

  // Get all user books with book metadata and shelf names
  const rows = await db
    .select({
      title: books.title,
      author: books.author,
      additionalAuthors: books.additionalAuthors,
      isbn13: books.isbn13,
      isbn10: books.isbn10,
      pageCount: books.pageCount,
      publishedDate: books.publishedDate,
      genres: books.genres,
      rating: userBooks.rating,
      notes: userBooks.notes,
      currentPage: userBooks.currentPage,
      progressPercent: userBooks.progressPercent,
      totalMinutes: userBooks.totalMinutes,
      currentMinutes: userBooks.currentMinutes,
      dateAdded: userBooks.dateAdded,
      dateStarted: userBooks.dateStarted,
      dateFinished: userBooks.dateFinished,
      shelfNames: sql<string>`array_to_string(array_agg(distinct ${shelves.name}), ', ')`,
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .leftJoin(userBookShelves, eq(userBooks.id, userBookShelves.userBookId))
    .leftJoin(shelves, eq(userBookShelves.shelfId, shelves.id))
    .where(eq(userBooks.userId, userId))
    .groupBy(
      books.title, books.author, books.additionalAuthors,
      books.isbn13, books.isbn10, books.pageCount, books.publishedDate, books.genres,
      userBooks.rating, userBooks.notes, userBooks.currentPage, userBooks.progressPercent,
      userBooks.totalMinutes, userBooks.currentMinutes,
      userBooks.dateAdded, userBooks.dateStarted, userBooks.dateFinished,
    )
    .orderBy(books.title)

  const exportData = rows.map(r => ({
    title: r.title,
    author: r.author,
    additionalAuthors: r.additionalAuthors?.join(', ') ?? '',
    isbn13: r.isbn13 ?? '',
    isbn10: r.isbn10 ?? '',
    pageCount: r.pageCount,
    publishedDate: r.publishedDate ?? '',
    genres: r.genres?.join(', ') ?? '',
    shelves: r.shelfNames ?? '',
    rating: r.rating,
    notes: r.notes ?? '',
    currentPage: r.currentPage,
    progressPercent: r.progressPercent ? Number(r.progressPercent) : null,
    totalMinutes: r.totalMinutes,
    currentMinutes: r.currentMinutes,
    dateAdded: r.dateAdded?.toISOString().slice(0, 10) ?? '',
    dateStarted: r.dateStarted?.toISOString().slice(0, 10) ?? '',
    dateFinished: r.dateFinished?.toISOString().slice(0, 10) ?? '',
  }))

  if (format === 'json') {
    setResponseHeader(event, 'Content-Type', 'application/json')
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename="bookshelf-export.json"')
    return exportData
  }

  // CSV
  const headers = [
    'Title', 'Author', 'Additional Authors', 'ISBN-13', 'ISBN-10',
    'Page Count', 'Published Date', 'Genres', 'Shelves', 'Rating',
    'Notes', 'Current Page', 'Progress %', 'Total Minutes', 'Current Minutes',
    'Date Added', 'Date Started', 'Date Finished',
  ]

  const csvRows = [
    headers.join(','),
    ...exportData.map(row => [
      csvEscape(row.title),
      csvEscape(row.author),
      csvEscape(row.additionalAuthors),
      csvEscape(row.isbn13),
      csvEscape(row.isbn10),
      row.pageCount ?? '',
      csvEscape(row.publishedDate),
      csvEscape(row.genres),
      csvEscape(row.shelves),
      row.rating ?? '',
      csvEscape(row.notes),
      row.currentPage ?? '',
      row.progressPercent ?? '',
      row.totalMinutes ?? '',
      row.currentMinutes ?? '',
      csvEscape(row.dateAdded),
      csvEscape(row.dateStarted),
      csvEscape(row.dateFinished),
    ].join(',')),
  ]

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="bookshelf-export.csv"')
  return csvRows.join('\n')
})

function csvEscape(val: string): string {
  if (!val) return ''
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}
