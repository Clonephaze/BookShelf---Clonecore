import { eq, and, sql, isNotNull, asc, desc } from 'drizzle-orm'
import { useDB } from '../../database'
import { userBooks, books } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const query = getQuery(event)
  const year = Number(query.year) || null

  const finishedWithPages = and(
    eq(userBooks.userId, userId),
    isNotNull(userBooks.dateFinished),
    isNotNull(books.pageCount),
    sql`${books.pageCount} > 0`,
    ...(year ? [sql`extract(year from ${userBooks.dateFinished})::int = ${year}`] : []),
  )

  const [buckets, shortest, longest] = await Promise.all([
    // Page count distribution in buckets
    db
      .select({
        bucket: sql<string>`case
          when ${books.pageCount} < 200 then 'Under 200'
          when ${books.pageCount} < 400 then '200–399'
          when ${books.pageCount} < 600 then '400–599'
          else '600+'
        end`,
        bucketOrder: sql<number>`case
          when ${books.pageCount} < 200 then 1
          when ${books.pageCount} < 400 then 2
          when ${books.pageCount} < 600 then 3
          else 4
        end`,
        count: sql<number>`count(*)::int`,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(finishedWithPages)
      .groupBy(
        sql`case
          when ${books.pageCount} < 200 then 'Under 200'
          when ${books.pageCount} < 400 then '200–399'
          when ${books.pageCount} < 600 then '400–599'
          else '600+'
        end`,
        sql`case
          when ${books.pageCount} < 200 then 1
          when ${books.pageCount} < 400 then 2
          when ${books.pageCount} < 600 then 3
          else 4
        end`,
      )
      .orderBy(sql`case
        when ${books.pageCount} < 200 then 1
        when ${books.pageCount} < 400 then 2
        when ${books.pageCount} < 600 then 3
        else 4
      end`),

    // Shortest finished book
    db
      .select({
        title: books.title,
        author: books.author,
        pageCount: books.pageCount,
        coverUrlSmall: books.coverUrlSmall,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(finishedWithPages)
      .orderBy(asc(books.pageCount))
      .limit(1),

    // Longest finished book
    db
      .select({
        title: books.title,
        author: books.author,
        pageCount: books.pageCount,
        coverUrlSmall: books.coverUrlSmall,
      })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(finishedWithPages)
      .orderBy(desc(books.pageCount))
      .limit(1),
  ])

  // Ensure all buckets are present with 0 fallback
  const allBuckets = [
    { bucket: 'Under 200', order: 1 },
    { bucket: '200–399', order: 2 },
    { bucket: '400–599', order: 3 },
    { bucket: '600+', order: 4 },
  ]
  const distribution = allBuckets.map(b => ({
    bucket: b.bucket,
    count: buckets.find(r => r.bucket === b.bucket)?.count ?? 0,
  }))

  return {
    distribution,
    shortest: shortest[0] ?? null,
    longest: longest[0] ?? null,
  }
})
