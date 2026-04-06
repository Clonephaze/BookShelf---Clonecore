// ============================================
// Goodreads CSV Parser — Bookshelf
// ============================================
// Parses Goodreads CSV exports with their quirky format.
// Handles: ISBN wrapping (="..."), Author l-f format,
// multiple shelves, rating 0 = unrated, HTML in reviews,
// empty dates, and quoted fields with commas.
// ============================================

export interface GoodreadsRow {
  bookId: string
  title: string
  author: string
  authorLastFirst: string
  additionalAuthors: string[]
  isbn10: string | null
  isbn13: string | null
  myRating: number | null // null means unrated (Goodreads uses 0)
  averageRating: number | null
  publisher: string | null
  binding: string | null
  pageCount: number | null
  yearPublished: number | null
  originalPublicationYear: number | null
  dateRead: Date | null
  dateAdded: Date | null
  bookshelves: string[]
  exclusiveShelf: string // read | currently-reading | to-read
  myReview: string | null
  privateNotes: string | null
  readCount: number
}

/**
 * Parse a Goodreads CSV string into structured rows.
 * Handles RFC 4180 CSV (quoted fields, embedded commas, embedded quotes).
 */
export function parseGoodreadsCsv(csvText: string): GoodreadsRow[] {
  const lines = splitCsvLines(csvText)
  if (lines.length < 2) return []

  const headerLine = lines[0]
  if (!headerLine) return []
  const headers = parseCsvRow(headerLine)
  const headerMap = new Map(headers.map((h, i) => [h.trim(), i]))

  function col(row: string[], name: string): string {
    const idx = headerMap.get(name)
    if (idx === undefined) return ''
    return (row[idx] ?? '').trim()
  }

  const rows: GoodreadsRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i]
    if (!rawLine) continue
    const line = rawLine.trim()
    if (!line) continue

    const fields = parseCsvRow(line)
    if (fields.length < headers.length - 2) continue // Skip clearly broken rows

    const rating = parseInt(col(fields, 'My Rating'), 10)
    const avgRating = parseFloat(col(fields, 'Average Rating'))
    const pageCountRaw = parseInt(col(fields, 'Number of Pages'), 10)
    const yearPub = parseInt(col(fields, 'Year Published'), 10)
    const origYear = parseInt(col(fields, 'Original Publication Year'), 10)
    const readCountRaw = parseInt(col(fields, 'Read Count'), 10)

    const additionalAuthorsRaw = col(fields, 'Additional Authors')

    rows.push({
      bookId: col(fields, 'Book Id'),
      title: col(fields, 'Title'),
      author: col(fields, 'Author'),
      authorLastFirst: col(fields, 'Author l-f'),
      additionalAuthors: additionalAuthorsRaw
        ? additionalAuthorsRaw.split(',').map(a => a.trim()).filter(Boolean)
        : [],
      isbn10: cleanIsbn(col(fields, 'ISBN')),
      isbn13: cleanIsbn(col(fields, 'ISBN13')),
      myRating: isNaN(rating) || rating === 0 ? null : rating,
      averageRating: isNaN(avgRating) ? null : avgRating,
      publisher: col(fields, 'Publisher') || null,
      binding: col(fields, 'Binding') || null,
      pageCount: isNaN(pageCountRaw) ? null : pageCountRaw,
      yearPublished: isNaN(yearPub) ? null : yearPub,
      originalPublicationYear: isNaN(origYear) ? null : origYear,
      dateRead: parseGoodreadsDate(col(fields, 'Date Read')),
      dateAdded: parseGoodreadsDate(col(fields, 'Date Added')),
      bookshelves: col(fields, 'Bookshelves')
        ? col(fields, 'Bookshelves').split(',').map(s => s.trim()).filter(Boolean)
        : [],
      exclusiveShelf: col(fields, 'Exclusive Shelf') || 'to-read',
      myReview: stripHtml(col(fields, 'My Review')) || null,
      privateNotes: col(fields, 'Private Notes') || null,
      readCount: isNaN(readCountRaw) ? 0 : readCountRaw,
    })
  }

  return rows
}

/**
 * Goodreads wraps ISBNs as ="0123456789" — strip the wrapping.
 * Also trims spaces and returns null for empty.
 */
function cleanIsbn(raw: string): string | null {
  if (!raw) return null
  let cleaned = raw.trim()
  // Remove ="..." wrapping
  if (cleaned.startsWith('="') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(2, -1)
  }
  // Remove any remaining quotes
  cleaned = cleaned.replace(/"/g, '').trim()
  return cleaned || null
}

/**
 * Parse Goodreads date format (YYYY/MM/DD).
 */
function parseGoodreadsDate(raw: string): Date | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // YYYY/MM/DD
  const parts = trimmed.split('/')
  if (parts.length === 3) {
    const yStr = parts[0], mStr = parts[1], dStr = parts[2]
    if (yStr && mStr && dStr) {
      const y = Number(yStr)
      const m = Number(mStr)
      const d = Number(dStr)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d)
      }
    }
  }
  // Try ISO fallback
  const d = new Date(trimmed)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Strip basic HTML tags and entities from review text.
 */
function stripHtml(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Map Goodreads exclusive shelf names to Bookshelf default shelf slugs.
 */
export function mapGoodreadsShelf(exclusiveShelf: string): string {
  switch (exclusiveShelf.trim().toLowerCase()) {
    case 'read':
      return 'read'
    case 'currently-reading':
      return 'currently-reading'
    case 'to-read':
    default:
      return 'want-to-read'
  }
}

// --- RFC 4180 CSV Parsing ---

/**
 * Split CSV text into logical lines (respects quoted fields spanning multiple lines).
 */
function splitCsvLines(text: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++ // Skip escaped quote
      } else {
        inQuotes = !inQuotes
        current += ch
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++ // Skip \r\n
      if (current.trim()) lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  if (current.trim()) lines.push(current)
  return lines
}

/**
 * Parse a single CSV row into fields, handling quoted values.
 */
function parseCsvRow(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const ch = line[i]

    if (ch === '"') {
      if (!inQuotes) {
        inQuotes = true
      } else if (line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = false
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }

    i++
  }

  fields.push(current) // Last field
  return fields
}
