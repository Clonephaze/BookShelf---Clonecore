/**
 * Generates fun fake personal data for imported Audible books.
 *
 * For each userBook belonging to the target user:
 *   - Rating: 4 or 5 stars (weighted 40% fours, 60% fives)
 *   - dateStarted: a few days before dateFinished (based on page count & reading speed)
 *   - currentPage + progressPercent: set to 100% / full page count
 *   - 2–5 reading sessions per book spread across the reading period
 *   - Activity log entries: added_book, started_reading, finished_reading, rated_book
 *
 * Usage: node scripts/generate-reading-data.mjs
 * Reads DATABASE_URL from .env
 */

import 'dotenv/config'
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set — create a .env file')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

// ── Config ──

const TARGET_EMAIL = 'jackdsmith2327@gmail.com'
const MIN_RATING = 4
const MAX_RATING = 5
const FIVE_STAR_WEIGHT = 0.6 // 60% chance of 5 stars
const MIN_SESSIONS = 2
const MAX_SESSIONS = 5
const PAGES_PER_HOUR_MIN = 40  // fast reader range
const PAGES_PER_HOUR_MAX = 70

// ── Helpers ──

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function weightedRating() {
  return Math.random() < FIVE_STAR_WEIGHT ? 5 : 4
}

function randomMinutes(min, max) {
  return rand(min, max)
}

function jitterDate(date, hoursRange) {
  const ms = date.getTime() + rand(-hoursRange * 60, hoursRange * 60) * 60000
  return new Date(ms)
}

// ── Main ──

async function main() {
  // Find user
  const users = await sql`SELECT id, name FROM "user" WHERE email = ${TARGET_EMAIL}`
  if (users.length === 0) {
    console.error(`No user found with email: ${TARGET_EMAIL}`)
    process.exit(1)
  }
  const userId = users[0].id
  console.log(`Found user: ${users[0].name} (${userId})`)

  // Get all userBooks with their book data
  const userBooksRaw = await sql`
    SELECT
      ub.id as user_book_id,
      ub.book_id,
      ub.rating as existing_rating,
      ub.date_added,
      ub.date_finished,
      ub.date_started as existing_started,
      b.title,
      b.page_count,
      b.genres
    FROM user_books ub
    JOIN books b ON b.id = ub.book_id
    WHERE ub.user_id = ${userId}
    ORDER BY ub.date_finished ASC NULLS LAST
  `

  console.log(`Found ${userBooksRaw.length} books in library\n`)

  // Check for existing sessions to avoid duplicates
  const existingSessions = await sql`
    SELECT DISTINCT user_book_id FROM reading_sessions WHERE user_id = ${userId}
  `
  const hasSessionsSet = new Set(existingSessions.map(r => r.user_book_id))

  // Check for existing activity
  const existingActivity = await sql`
    SELECT DISTINCT user_book_id, action FROM activity_log WHERE user_id = ${userId} AND action = 'rated_book'
  `
  const hasRatingActivity = new Set(existingActivity.map(r => r.user_book_id))

  let updatedRatings = 0
  let createdSessions = 0
  let createdActivity = 0
  let skippedBooks = 0

  for (const ub of userBooksRaw) {
    const userBookId = ub.user_book_id
    const bookId = ub.book_id
    const pageCount = ub.page_count || rand(200, 400) // fallback if no page count
    const dateFinished = ub.date_finished ? new Date(ub.date_finished) : null
    const dateAdded = new Date(ub.date_added)

    if (!dateFinished) {
      skippedBooks++
      continue // skip books without a finish date
    }

    // ── Rating ──
    const rating = weightedRating()
    await sql`
      UPDATE user_books
      SET rating = ${rating},
          current_page = ${pageCount},
          progress_percent = 100,
          updated_at = NOW()
      WHERE id = ${userBookId} AND rating IS NULL
    `
    updatedRatings++

    // ── date_started (if missing) ──
    // Calculate reading days based on page count and speed
    const pagesPerHour = rand(PAGES_PER_HOUR_MIN, PAGES_PER_HOUR_MAX)
    const totalHours = pageCount / pagesPerHour
    const readingDays = Math.max(1, Math.ceil(totalHours / rand(2, 5))) // 2-5 hours per day
    const dateStarted = ub.existing_started
      ? new Date(ub.existing_started)
      : new Date(dateFinished.getTime() - readingDays * 24 * 60 * 60 * 1000)

    if (!ub.existing_started) {
      await sql`
        UPDATE user_books
        SET date_started = ${dateStarted.toISOString()},
            updated_at = NOW()
        WHERE id = ${userBookId} AND date_started IS NULL
      `
    }

    // ── Reading Sessions ──
    if (!hasSessionsSet.has(userBookId)) {
      const numSessions = rand(MIN_SESSIONS, MAX_SESSIONS)
      const totalReadingMinutes = Math.round(totalHours * 60)
      const readingSpan = dateFinished.getTime() - dateStarted.getTime()

      // Distribute sessions across the reading period
      for (let s = 0; s < numSessions; s++) {
        const fraction = (s + 0.5) / numSessions
        const sessionStart = new Date(dateStarted.getTime() + readingSpan * fraction)
        // Jitter by a few hours
        const jitteredStart = jitterDate(sessionStart, 3)

        // Each session is roughly equal duration, with some variance
        const baseDuration = totalReadingMinutes / numSessions
        const sessionMinutes = Math.max(15, Math.round(baseDuration * (0.6 + Math.random() * 0.8)))
        const sessionSeconds = sessionMinutes * 60
        const sessionEnd = new Date(jitteredStart.getTime() + sessionSeconds * 1000)

        // Pages for this session
        const sessionPages = Math.round(pageCount / numSessions * (0.7 + Math.random() * 0.6))
        const startPage = Math.max(1, Math.round(pageCount * (s / numSessions)))
        const endPage = Math.min(pageCount, startPage + sessionPages)

        await sql`
          INSERT INTO reading_sessions (user_id, user_book_id, started_at, ended_at, duration_seconds, timer_mode, start_page, end_page, pages_read, status)
          VALUES (${userId}, ${userBookId}, ${jitteredStart.toISOString()}, ${sessionEnd.toISOString()}, ${sessionSeconds}, 'open', ${startPage}, ${endPage}, ${endPage - startPage}, 'completed')
        `
        createdSessions++
      }
    }

    // ── Activity Log ──
    // added_book
    await sql`
      INSERT INTO activity_log (user_id, action, user_book_id, created_at)
      VALUES (${userId}, 'added_book', ${userBookId}, ${dateAdded.toISOString()})
      ON CONFLICT DO NOTHING
    `
    createdActivity++

    // started_reading
    await sql`
      INSERT INTO activity_log (user_id, action, user_book_id, created_at)
      VALUES (${userId}, 'started_reading', ${userBookId}, ${dateStarted.toISOString()})
      ON CONFLICT DO NOTHING
    `
    createdActivity++

    // finished_reading
    await sql`
      INSERT INTO activity_log (user_id, action, user_book_id, created_at)
      VALUES (${userId}, 'finished_reading', ${userBookId}, ${dateFinished.toISOString()})
      ON CONFLICT DO NOTHING
    `
    createdActivity++

    // rated_book
    if (!hasRatingActivity.has(userBookId)) {
      const ratedAt = new Date(dateFinished.getTime() + rand(1, 30) * 60 * 1000) // few mins after finishing
      await sql`
        INSERT INTO activity_log (user_id, action, user_book_id, metadata, created_at)
        VALUES (${userId}, 'rated_book', ${userBookId}, ${JSON.stringify({ rating })}, ${ratedAt.toISOString()})
      `
      createdActivity++
    }

    // Progress
    if ((updatedRatings % 50) === 0) {
      console.log(`  ... processed ${updatedRatings} books`)
    }
  }

  console.log(`\nDone!`)
  console.log(`  Ratings set:       ${updatedRatings} (${MIN_RATING}-${MAX_RATING} stars)`)
  console.log(`  Sessions created:  ${createdSessions}`)
  console.log(`  Activity entries:  ${createdActivity}`)
  console.log(`  Skipped (no date): ${skippedBooks}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
