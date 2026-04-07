/**
 * Converts an OpenAudible CSV export to Goodreads-compatible CSV
 * for import into Bookshelf.
 *
 * Usage: node scripts/convert-audible.mjs books.csv
 * Output: books-converted.csv (same directory as input)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Usage: node scripts/convert-audible.mjs <path-to-audible-csv>')
  process.exit(1)
}

const absPath = resolve(inputPath)
const raw = readFileSync(absPath, 'utf-8')

// ── RFC 4180 CSV parser (handles quoted fields with commas) ──

function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

// ── Title cleaning ──

function cleanTitle(title, seriesName) {
  let cleaned = title

  // Strip everything after " - " (series/subtitle junk)
  const dashIdx = cleaned.indexOf(' - ')
  if (dashIdx > 0) {
    cleaned = cleaned.substring(0, dashIdx)
  }

  // Strip trailing parenthetical series info: "(The Completionist Chronicles, Book 13)"
  cleaned = cleaned.replace(/\s*\([^)]*(?:book|vol|series|chronicles)[^)]*\)\s*$/i, '')

  // Strip common LitRPG subtitle suffixes after colon
  cleaned = cleaned.replace(/:\s*(?:A LitRPG Adventure|An Epic Fantasy.*|A Cozy Guide.*)\s*$/i, '')

  // Strip trailing "- A Novel", "- A Memoir" etc.
  cleaned = cleaned.replace(/\s*-\s*A\s+\w+\s*$/, '')

  return cleaned.trim()
}

// ── Date conversion: M/D/YYYY → YYYY/MM/DD ──

function convertDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length !== 3) return ''
  const [m, d, y] = parts
  return `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`
}

// ── Shelf mapping ──

function mapShelf(_readStatus) {
  return 'read'
}

// ── Extract first author (strip " - editor" etc.) ──

function cleanAuthor(author) {
  return author.replace(/\s*-\s*editor\s*$/i, '').trim()
}

// ── Parse & convert ──

const lines = raw.split(/\r?\n/).filter(l => l.trim())
const headers = parseCsvLine(lines[0])

// Map column names to indices
const col = {}
headers.forEach((h, i) => { col[h] = i })

const rows = []
let skipped = 0

for (let i = 1; i < lines.length; i++) {
  const fields = parseCsvLine(lines[i])
  if (fields.length < 5) { skipped++; continue }

  const title = fields[col['Title']] || ''
  const author = fields[col['Author']] || ''
  const purchaseDate = fields[col['Purchase Date']] || ''
  const readStatus = fields[col['Read Status']] || ''
  const seriesName = fields[col['Series Name']] || ''
  const releaseDate = fields[col['Release Date']] || ''

  // Skip test/placeholder entries
  if (author.toLowerCase() === 'test') { skipped++; continue }

  const cleaned = cleanTitle(title, seriesName)
  const cleanedAuthor = cleanAuthor(author)

  rows.push({
    title: cleaned,
    author: cleanedAuthor,
    exclusiveShelf: mapShelf(readStatus),
    dateAdded: convertDate(purchaseDate),
    yearPublished: releaseDate ? releaseDate.split('/').pop() : '',
  })
}

// ── Deduplicate by title+author (keep most recent by dateAdded) ──

const seen = new Map()
for (const row of rows) {
  const key = `${row.title.toLowerCase()}|||${row.author.toLowerCase()}`
  const existing = seen.get(key)
  if (!existing || row.dateAdded > existing.dateAdded) {
    seen.set(key, row)
  }
}
const deduped = [...seen.values()]
const dupCount = rows.length - deduped.length

// ── Write Goodreads-compatible CSV ──

const goodreadsHeaders = [
  'Book Id', 'Title', 'Author', 'Author l-f', 'Additional Authors',
  'ISBN', 'ISBN13', 'My Rating', 'Average Rating', 'Publisher',
  'Binding', 'Number of Pages', 'Year Published', 'Original Publication Year',
  'Date Read', 'Date Added', 'Bookshelves', 'Exclusive Shelf',
  'My Review', 'Private Notes', 'Read Count',
]

function csvEscape(val) {
  const s = String(val || '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const outputLines = [goodreadsHeaders.join(',')]

for (const row of deduped) {
  const values = [
    '',                   // Book Id
    row.title,            // Title
    row.author,           // Author
    '',                   // Author l-f
    '',                   // Additional Authors
    '',                   // ISBN
    '',                   // ISBN13
    '0',                  // My Rating (0 = unrated)
    '',                   // Average Rating
    '',                   // Publisher
    'Audiobook',          // Binding
    '',                   // Number of Pages
    row.yearPublished,    // Year Published
    '',                   // Original Publication Year
    row.dateAdded,        // Date Read (= purchase date)
    row.dateAdded,        // Date Added
    '',                   // Bookshelves
    row.exclusiveShelf,   // Exclusive Shelf
    '',                   // My Review
    '',                   // Private Notes
    '1',                  // Read Count
  ]
  outputLines.push(values.map(csvEscape).join(','))
}

const outName = basename(absPath, '.csv') + '-goodreads.csv'
const outPath = resolve(dirname(absPath), outName)
writeFileSync(outPath, outputLines.join('\n'), 'utf-8')

console.log(`Done!`)
console.log(`  Input:      ${lines.length - 1} rows`)
console.log(`  Skipped:    ${skipped} (test entries / bad rows)`)
console.log(`  Duplicates: ${dupCount} removed (kept most recent)`)
console.log(`  Output:     ${deduped.length} books → ${outPath}`)
