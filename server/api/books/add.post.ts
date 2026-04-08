import { eq, or, and } from 'drizzle-orm'
import { useDB } from '../../database'
import { books, userBooks, userBookShelves, shelves } from '../../database/schema'
import { requireServerSession } from '../../utils/session'
import { logActivity } from '../../utils/activity'
import type { AddBookPayload } from '../../services/book-api/types'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const body = await readBody<AddBookPayload>(event)

  if (!body?.book?.title || !body?.shelfId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing book data or shelf ID',
    })
  }

  const { book, shelfId } = body

  // Verify the shelf belongs to this user
  const [shelf] = await db
    .select({ id: shelves.id })
    .from(shelves)
    .where(and(eq(shelves.id, shelfId), eq(shelves.userId, session.user.id)))
    .limit(1)

  if (!shelf) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Shelf not found',
    })
  }

  // Dedup: check if this book already exists by ISBN-13, ISBN-10, OL key, or GB ID
  const conditions = []
  if (book.isbn13) conditions.push(eq(books.isbn13, book.isbn13))
  if (book.isbn10) conditions.push(eq(books.isbn10, book.isbn10))
  if (book.openLibraryKey) conditions.push(eq(books.openLibraryKey, book.openLibraryKey))
  if (book.googleBooksId) conditions.push(eq(books.googleBooksId, book.googleBooksId))
  if (book.hardcoverId) conditions.push(eq(books.hardcoverId, book.hardcoverId))

  let bookId: string

  if (conditions.length > 0) {
    const [existing] = await db
      .select({ id: books.id })
      .from(books)
      .where(or(...conditions))
      .limit(1)

    if (existing) {
      bookId = existing.id
    } else {
      const [inserted] = await db.insert(books).values({
        title: book.title,
        author: book.author,
        additionalAuthors: book.additionalAuthors,
        isbn13: book.isbn13,
        isbn10: book.isbn10,
        coverUrl: book.coverUrl,
        coverUrlSmall: book.coverUrlSmall,
        pageCount: book.pageCount,
        publishedDate: book.publishedDate,
        genres: book.genres,
        description: book.description,
        publisher: book.publisher,
        openLibraryKey: book.openLibraryKey,
        googleBooksId: book.googleBooksId,
        hardcoverSlug: book.hardcoverSlug,
        hardcoverId: book.hardcoverId,
        audioSeconds: book.audioSeconds,
        hasAudiobook: book.hasAudiobook ?? false,
        contentWarnings: book.contentWarnings,
        moods: book.moods,
      }).returning({ id: books.id })
      if (!inserted) throw createError({ statusCode: 500, statusMessage: 'Failed to insert book' })
      bookId = inserted.id
    }
  } else {
    // No identifiers — just insert
    const [inserted] = await db.insert(books).values({
      title: book.title,
      author: book.author,
      additionalAuthors: book.additionalAuthors,
      coverUrl: book.coverUrl,
      coverUrlSmall: book.coverUrlSmall,
      pageCount: book.pageCount,
      publishedDate: book.publishedDate,
      genres: book.genres,
      description: book.description,
      publisher: book.publisher,
      audioSeconds: book.audioSeconds,
      hasAudiobook: book.hasAudiobook ?? false,
      contentWarnings: book.contentWarnings,
      moods: book.moods,
    }).returning({ id: books.id })
    if (!inserted) throw createError({ statusCode: 500, statusMessage: 'Failed to insert book' })
    bookId = inserted.id
  }

  // Check if book already in user's library
  const [existingUserBook] = await db
    .select({ id: userBooks.id })
    .from(userBooks)
    .where(and(eq(userBooks.userId, session.user.id), eq(userBooks.bookId, bookId)))
    .limit(1)

  if (existingUserBook) {
    // Check if already on this specific shelf
    const [existingShelfEntry] = await db
      .select({ id: userBookShelves.id })
      .from(userBookShelves)
      .where(and(eq(userBookShelves.userBookId, existingUserBook.id), eq(userBookShelves.shelfId, shelfId)))
      .limit(1)

    if (existingShelfEntry) {
      return { success: true, alreadyExists: true, bookId, userBookId: existingUserBook.id }
    }

    // Add to the new shelf
    await db.insert(userBookShelves).values({
      userBookId: existingUserBook.id,
      shelfId,
      isPrimary: false,
    })

    return { success: true, bookId, userBookId: existingUserBook.id }
  }

  // Create user-book association
  const [newUserBook] = await db.insert(userBooks).values({
    userId: session.user.id,
    bookId,
  }).returning({ id: userBooks.id })
  if (!newUserBook) throw createError({ statusCode: 500, statusMessage: 'Failed to create user book' })

  // Add to the specified shelf as primary
  await db.insert(userBookShelves).values({
    userBookId: newUserBook.id,
    shelfId,
    isPrimary: true,
  })

  // Log activity
  logActivity({ userId: session.user.id, action: 'added_book', userBookId: newUserBook.id })

  return { success: true, bookId, userBookId: newUserBook.id }
})
