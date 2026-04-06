// ============================================
// Shareable Card Image Generator — Bookshelf
// ============================================
// Rich, visually captivating Canvas API cards
// inspired by Spotify Wrapped / literary aesthetics.
// Warm textures, decorative elements, bold typography.
// ============================================

export type CardTemplate = 'year-review' | 'monthly-recap' | 'book-review'
export type CardDimension = 'square' | 'story' | 'landscape'

export interface CardDimensions {
  width: number
  height: number
  label: string
}

export const CARD_DIMENSIONS: Record<CardDimension, CardDimensions> = {
  square: { width: 1080, height: 1080, label: 'Square (1:1)' },
  story: { width: 1080, height: 1920, label: 'Story (9:16)' },
  landscape: { width: 1200, height: 630, label: 'Landscape (OG)' },
}

export interface YearReviewData {
  year: number
  totalBooks: number
  totalPages: number
  avgRating: number | null
  topGenre: string | null
  topAuthor: string | null
}

export interface MonthlyRecapData {
  month: string
  year: number
  booksRead: number
  pagesRead: number
  topBook: string | null
}

export interface BookReviewData {
  title: string
  author: string
  rating: number | null
  coverUrl: string | null
  review: string | null
  pagesRead: number | null
}

const SITE_URL = 'bookshelf-clonecore.vercel.app'

// Brand palette
const C = {
  parchment: '#f4ebdb',
  cream: '#faf5eb',
  linen: '#ebe1cf',
  sand: '#d3c7b3',
  espresso: '#302318',
  walnut: '#5c4a38',
  driftwood: '#8a7a66',
  copper: '#a0592a',
  copperDark: '#854921',
  copperLight: '#c8844a',
  gold: '#d4a03e',
  goldLight: '#e5c050',
  warmWhite: '#f5ebd9',
}

// ── Drawing helpers ──────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const words = text.split(' ')
  let line = ''
  let lineCount = 0

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lineCount++
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + '…', x, y)
        return y + lineHeight
      }
      ctx.fillText(line.trim(), x, y)
      line = words[i] + ' '
      y += lineHeight
    }
    else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, y)
  return y + lineHeight
}

/** Warm parchment background with subtle texture grain */
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Base parchment
  ctx.fillStyle = C.parchment
  ctx.fillRect(0, 0, w, h)

  // Subtle radial warmth (lighter center)
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.8)
  grad.addColorStop(0, 'rgba(250, 245, 235, 0.5)')
  grad.addColorStop(1, 'rgba(244, 235, 219, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Paper texture: faint noise dots
  ctx.globalAlpha = 0.03
  for (let i = 0; i < w * h * 0.002; i++) {
    const tx = Math.random() * w
    const ty = Math.random() * h
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#8a7a66'
    ctx.fillRect(tx, ty, 1, 1)
  }
  ctx.globalAlpha = 1
}

/** Decorative border frame with corner ornaments */
function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, inset: number) {
  const outer = inset
  const inner = inset + 4

  // Double rule border
  ctx.strokeStyle = C.sand
  ctx.lineWidth = 1.5
  roundRect(ctx, outer, outer, w - outer * 2, h - outer * 2, 6)
  ctx.stroke()

  ctx.strokeStyle = C.copper
  ctx.lineWidth = 2
  roundRect(ctx, inner, inner, w - inner * 2, h - inner * 2, 4)
  ctx.stroke()

  // Corner flourishes (book-style ornaments)
  const corners = [
    { x: inner + 8, y: inner + 8, sx: 1, sy: 1 },
    { x: w - inner - 8, y: inner + 8, sx: -1, sy: 1 },
    { x: inner + 8, y: h - inner - 8, sx: 1, sy: -1 },
    { x: w - inner - 8, y: h - inner - 8, sx: -1, sy: -1 },
  ]
  ctx.fillStyle = C.copper
  for (const c of corners) {
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.scale(c.sx, c.sy)
    // Small diamond + leaf motif
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(6, 0)
    ctx.lineTo(0, 6)
    ctx.lineTo(-6, 0)
    ctx.closePath()
    ctx.fill()
    // Tiny leaf curves
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.quadraticCurveTo(16, -8, 24, 0)
    ctx.quadraticCurveTo(16, 4, 8, 0)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 8)
    ctx.quadraticCurveTo(-8, 16, 0, 24)
    ctx.quadraticCurveTo(4, 16, 0, 8)
    ctx.fill()
    ctx.restore()
  }
}

/** Branding footer with site URL and book icon */
function drawBranding(ctx: CanvasRenderingContext2D, w: number, h: number, pad: number, scale = 1) {
  const fontSize = Math.round(16 * scale)
  const urlFontSize = Math.round(13 * scale)
  const y = h - pad

  // Divider line
  ctx.strokeStyle = C.sand
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad + 20, y - Math.round(32 * scale))
  ctx.lineTo(w - pad - 20, y - Math.round(32 * scale))
  ctx.stroke()

  // Book icon (tiny open book)
  const iconX = pad + 24
  const iconY = y - Math.round(16 * scale)
  const iconS = scale * 0.9
  ctx.strokeStyle = C.copper
  ctx.lineWidth = 2 * iconS
  ctx.beginPath()
  ctx.moveTo(iconX, iconY - 8 * iconS)
  ctx.quadraticCurveTo(iconX + 8 * iconS, iconY - 12 * iconS, iconX + 14 * iconS, iconY - 8 * iconS)
  ctx.lineTo(iconX + 14 * iconS, iconY + 4 * iconS)
  ctx.quadraticCurveTo(iconX + 8 * iconS, iconY, iconX, iconY + 4 * iconS)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(iconX, iconY - 8 * iconS)
  ctx.quadraticCurveTo(iconX - 8 * iconS, iconY - 12 * iconS, iconX - 14 * iconS, iconY - 8 * iconS)
  ctx.lineTo(iconX - 14 * iconS, iconY + 4 * iconS)
  ctx.quadraticCurveTo(iconX - 8 * iconS, iconY, iconX, iconY + 4 * iconS)
  ctx.closePath()
  ctx.stroke()

  // "Bookshelf" text
  ctx.fillStyle = C.espresso
  ctx.font = `600 ${fontSize}px 'Lora', Georgia, serif`
  ctx.textAlign = 'left'
  ctx.fillText('Bookshelf', iconX + Math.round(22 * iconS), y - Math.round(8 * scale))

  // URL
  ctx.fillStyle = C.driftwood
  ctx.font = `400 ${urlFontSize}px 'Inter', system-ui, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(SITE_URL, w - pad - 24, y - Math.round(8 * scale))
  ctx.textAlign = 'left'
}

/** Draw a large decorative stat with label */
function drawBigStat(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  value: string, label: string,
  valueSize: number,
  labelSize: number,
  align: CanvasTextAlign = 'left',
) {
  ctx.textAlign = align
  ctx.fillStyle = C.copper
  ctx.font = `700 ${valueSize}px 'Lora', Georgia, serif`
  ctx.fillText(value, x, y)
  ctx.fillStyle = C.walnut
  ctx.font = `500 ${labelSize}px 'Inter', system-ui, sans-serif`
  ctx.fillText(label, x, y + Math.round(labelSize * 1.8))
  ctx.textAlign = 'left'
}

/** Stat card with warm fill and copper accent top */
function drawStatCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  value: string,
  label: string,
) {
  // Card shadow
  ctx.fillStyle = 'rgba(48, 35, 24, 0.06)'
  roundRect(ctx, x + 2, y + 3, w, h, 12)
  ctx.fill()

  // Card body
  roundRect(ctx, x, y, w, h, 12)
  ctx.fillStyle = C.cream
  ctx.fill()

  // Top accent stripe
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + 12, y)
  ctx.lineTo(x + w - 12, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + 12)
  ctx.lineTo(x + w, y + 5)
  ctx.lineTo(x, y + 5)
  ctx.lineTo(x, y + 12)
  ctx.quadraticCurveTo(x, y, x + 12, y)
  ctx.closePath()
  ctx.fillStyle = C.copper
  ctx.fill()
  ctx.restore()

  // Value
  ctx.fillStyle = C.espresso
  ctx.font = `bold ${Math.round(h * 0.3)}px 'Lora', Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText(value, x + w / 2, y + h * 0.48)

  // Label
  ctx.fillStyle = C.driftwood
  ctx.font = `500 ${Math.round(h * 0.14)}px 'Inter', system-ui, sans-serif`
  ctx.fillText(label, x + w / 2, y + h * 0.7)
  ctx.textAlign = 'left'
}

/** Decorative star rating with gold fill */
function drawStars(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  rating: number,
  size: number,
) {
  const gap = size * 0.25
  for (let i = 0; i < 5; i++) {
    const cx = x + i * (size + gap) + size / 2
    const cy = y
    const filled = i < rating

    ctx.beginPath()
    for (let p = 0; p < 5; p++) {
      const outerR = size / 2
      const innerR = size / 4.5

      const outerAngle = (p * 2 * Math.PI) / 5 - Math.PI / 2
      const innerAngle = ((p * 2 + 1) * Math.PI) / 5 - Math.PI / 2

      if (p === 0) ctx.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle))
      else ctx.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle))
      ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle))
    }
    ctx.closePath()

    if (filled) {
      ctx.fillStyle = C.gold
      ctx.fill()
      ctx.strokeStyle = C.copperDark
      ctx.lineWidth = 1
      ctx.stroke()
    }
    else {
      ctx.strokeStyle = C.sand
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
}

/** Decorative wavy divider */
function drawWaveDivider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = C.sand
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const amplitude = 4
  const wavelength = 20
  for (let i = 0; i <= w; i++) {
    const py = y + Math.sin((i / wavelength) * Math.PI * 2) * amplitude
    if (i === 0) ctx.moveTo(x + i, py)
    else ctx.lineTo(x + i, py)
  }
  ctx.stroke()
}

/** Little open-book silhouette as decorative accent */
function drawBookAccent(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, alpha = 0.08) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.fillStyle = C.copper

  // Left page
  ctx.beginPath()
  ctx.moveTo(0, -40)
  ctx.quadraticCurveTo(-60, -55, -80, -30)
  ctx.lineTo(-80, 40)
  ctx.quadraticCurveTo(-60, 25, 0, 40)
  ctx.closePath()
  ctx.fill()

  // Right page
  ctx.beginPath()
  ctx.moveTo(0, -40)
  ctx.quadraticCurveTo(60, -55, 80, -30)
  ctx.lineTo(80, 40)
  ctx.quadraticCurveTo(60, 25, 0, 40)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// ── Year in Review ───────────────────────────────────────

export function generateYearReviewCard(
  data: YearReviewData,
  dimension: CardDimension = 'square',
): HTMLCanvasElement {
  const { width: w, height: h } = CARD_DIMENSIONS[dimension]
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const pad = Math.round(w * 0.06)
  const isLandscape = dimension === 'landscape'
  const isStory = dimension === 'story'

  drawBackground(ctx, w, h)

  // Decorative book silhouettes
  drawBookAccent(ctx, w * 0.85, h * 0.12, isLandscape ? 1.5 : 2.5, 0.06)
  if (!isLandscape) drawBookAccent(ctx, w * 0.1, h * 0.88, 1.8, 0.04)

  drawFrame(ctx, w, h, pad - 10)

  // ── Header ──
  const headY = isLandscape ? pad + 28 : isStory ? pad + 80 : pad + 50

  // "My Year in Books" label with small ornament
  ctx.fillStyle = C.driftwood
  ctx.font = `500 ${isLandscape ? 16 : 22}px 'Inter', system-ui, sans-serif`
  const labelText = 'My Year in Books'
  const labelW = ctx.measureText(labelText).width
  ctx.fillText(labelText, pad + 30, headY)
  // Tiny ornamental line after label
  ctx.strokeStyle = C.copper
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pad + 34 + labelW, headY - 4)
  ctx.lineTo(pad + 34 + labelW + 40, headY - 4)
  ctx.stroke()

  // Giant year
  const yearSize = isLandscape ? 72 : isStory ? 120 : 110
  ctx.fillStyle = C.espresso
  ctx.font = `700 ${yearSize}px 'Lora', Georgia, serif`
  const yearY = headY + yearSize * 0.9
  ctx.fillText(String(data.year), pad + 30, yearY)

  // Decorative underline beneath year
  const yearW = ctx.measureText(String(data.year)).width
  ctx.strokeStyle = C.copper
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad + 30, yearY + 8)
  ctx.lineTo(pad + 30 + yearW, yearY + 8)
  ctx.stroke()

  // ── Stats grid ──
  const statsY = yearY + (isLandscape ? 40 : isStory ? 80 : 60)
  const cardH = isLandscape ? 95 : isStory ? 150 : 140

  if (isLandscape) {
    // Landscape: 4 across
    const cardW = (w - pad * 2 - 60 - 30 * 3) / 4
    const stats = [
      { value: String(data.totalBooks), label: 'Books Read' },
      { value: formatNum(data.totalPages), label: 'Pages Turned' },
      { value: data.avgRating ? `${data.avgRating.toFixed(1)}` : '—', label: 'Avg Rating' },
      { value: data.topGenre || '—', label: 'Top Genre' },
    ]
    stats.forEach((s, i) => {
      drawStatCard(ctx, pad + 30 + i * (cardW + 30), statsY, cardW, cardH, s.value, s.label)
    })
  }
  else {
    // Square / Story: 2x2 grid
    const cardW = (w - pad * 2 - 60 - 30) / 2
    const stats = [
      { value: String(data.totalBooks), label: 'Books Read' },
      { value: formatNum(data.totalPages), label: 'Pages Turned' },
      { value: data.avgRating ? `${data.avgRating.toFixed(1)} ★` : '—', label: 'Avg Rating' },
      { value: data.topGenre || '—', label: 'Top Genre' },
    ]
    stats.forEach((s, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      drawStatCard(ctx, pad + 30 + col * (cardW + 30), statsY + row * (cardH + 24), cardW, cardH, s.value, s.label)
    })
  }

  // ── Top author callout ──
  if (data.topAuthor) {
    const authorY = isLandscape
      ? h - pad - 52
      : statsY + 2 * (cardH + 24) + (isStory ? 60 : 40)

    drawWaveDivider(ctx, pad + 40, authorY - 20, w - pad * 2 - 80)

    ctx.fillStyle = C.walnut
    ctx.font = `italic 500 ${isLandscape ? 16 : 20}px 'Lora', Georgia, serif`
    ctx.fillText('Most-read author', pad + 30, authorY + 12)
    ctx.fillStyle = C.espresso
    ctx.font = `600 ${isLandscape ? 22 : 28}px 'Lora', Georgia, serif`
    ctx.fillText(data.topAuthor, pad + 30, authorY + (isLandscape ? 38 : 48))
  }

  drawBranding(ctx, w, h, pad + 20, isLandscape ? 0.85 : 1)

  return canvas
}

// ── Monthly Recap ────────────────────────────────────────

export function generateMonthlyRecapCard(
  data: MonthlyRecapData,
  dimension: CardDimension = 'square',
): HTMLCanvasElement {
  const { width: w, height: h } = CARD_DIMENSIONS[dimension]
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const pad = Math.round(w * 0.06)
  const isLandscape = dimension === 'landscape'
  const isStory = dimension === 'story'

  drawBackground(ctx, w, h)
  drawBookAccent(ctx, w * 0.82, h * 0.08, isLandscape ? 1.2 : 2, 0.05)
  drawFrame(ctx, w, h, pad - 10)

  // ── Header ──
  const headY = isLandscape ? pad + 28 : isStory ? pad + 80 : pad + 50

  ctx.fillStyle = C.driftwood
  ctx.font = `500 ${isLandscape ? 16 : 22}px 'Inter', system-ui, sans-serif`
  ctx.fillText('Monthly Reading Recap', pad + 30, headY)

  const monthSize = isLandscape ? 52 : isStory ? 72 : 64
  ctx.fillStyle = C.espresso
  ctx.font = `700 ${monthSize}px 'Lora', Georgia, serif`
  const monthLabel = `${data.month} ${data.year}`
  const monthY = headY + monthSize * 0.9
  ctx.fillText(monthLabel, pad + 30, monthY)

  // Copper underline
  const monthW = ctx.measureText(monthLabel).width
  ctx.strokeStyle = C.copper
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad + 30, monthY + 8)
  ctx.lineTo(pad + 30 + Math.min(monthW, w * 0.5), monthY + 8)
  ctx.stroke()

  // ── Hero stat (big books count) ──
  const heroY = monthY + (isLandscape ? 50 : isStory ? 100 : 80)

  if (!isLandscape) {
    // Centered hero number
    ctx.textAlign = 'center'
    ctx.fillStyle = C.copper
    ctx.font = `700 ${isStory ? 140 : 120}px 'Lora', Georgia, serif`
    ctx.fillText(String(data.booksRead), w / 2, heroY + (isStory ? 100 : 80))
    ctx.fillStyle = C.walnut
    ctx.font = `500 ${isStory ? 28 : 24}px 'Inter', system-ui, sans-serif`
    ctx.fillText(data.booksRead === 1 ? 'book read' : 'books read', w / 2, heroY + (isStory ? 140 : 116))
    ctx.textAlign = 'left'

    // Pages stat below
    const pagesY = heroY + (isStory ? 200 : 170)
    drawWaveDivider(ctx, pad + 40, pagesY - 20, w - pad * 2 - 80)
    drawBigStat(ctx, w / 2, pagesY + 10, formatNum(data.pagesRead), 'pages turned', isStory ? 48 : 42, isStory ? 20 : 18, 'center')
  }
  else {
    // Landscape: side by side
    const halfW = (w - pad * 2 - 60) / 2
    drawBigStat(ctx, pad + 30, heroY, String(data.booksRead), data.booksRead === 1 ? 'book read' : 'books read', 64, 16)
    drawBigStat(ctx, pad + 30 + halfW + 30, heroY, formatNum(data.pagesRead), 'pages turned', 64, 16)
  }

  // ── Top book highlight ──
  if (data.topBook) {
    const bookY = isLandscape
      ? h - pad - 52
      : isStory
        ? heroY + 340
        : heroY + 260

    ctx.fillStyle = C.driftwood
    ctx.font = `italic 500 ${isLandscape ? 14 : 18}px 'Lora', Georgia, serif`
    ctx.fillText('Highlight of the month', pad + 30, bookY)
    ctx.fillStyle = C.espresso
    ctx.font = `600 ${isLandscape ? 20 : 26}px 'Lora', Georgia, serif`
    wrapText(ctx, `"${data.topBook}"`, pad + 30, bookY + (isLandscape ? 28 : 36), w - pad * 2 - 60, isLandscape ? 28 : 36, 2)
  }

  drawBranding(ctx, w, h, pad + 20, isLandscape ? 0.85 : 1)

  return canvas
}

// ── Book Review ──────────────────────────────────────────

export function generateBookReviewCard(
  data: BookReviewData,
  dimension: CardDimension = 'square',
): HTMLCanvasElement {
  const { width: w, height: h } = CARD_DIMENSIONS[dimension]
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const pad = Math.round(w * 0.06)
  const isLandscape = dimension === 'landscape'
  const isStory = dimension === 'story'

  drawBackground(ctx, w, h)
  drawFrame(ctx, w, h, pad - 10)

  // ── "I just read…" header ──
  const headY = isLandscape ? pad + 32 : isStory ? pad + 80 : pad + 55

  ctx.fillStyle = C.driftwood
  ctx.font = `italic 500 ${isLandscape ? 18 : 24}px 'Lora', Georgia, serif`
  ctx.fillText('I just finished reading', pad + 30, headY)

  // ── Book title (large, multi-line) ──
  const titleSize = isLandscape ? 38 : isStory ? 52 : 48
  ctx.fillStyle = C.espresso
  ctx.font = `700 ${titleSize}px 'Lora', Georgia, serif`
  const titleY = headY + (isLandscape ? 44 : 50)
  const afterTitle = wrapText(ctx, data.title, pad + 30, titleY, w - pad * 2 - 60, Math.round(titleSize * 1.2), 3)

  // Author
  ctx.fillStyle = C.walnut
  ctx.font = `500 ${isLandscape ? 20 : 26}px 'Inter', system-ui, sans-serif`
  const authorY = afterTitle + (isLandscape ? 4 : 8)
  ctx.fillText(`by ${data.author}`, pad + 30, authorY)

  // ── Rating stars ──
  if (data.rating) {
    const starY = authorY + (isLandscape ? 30 : 44)
    const starSize = isLandscape ? 28 : 36
    drawStars(ctx, pad + 30, starY, data.rating, starSize)
  }

  // ── Review quote ──
  const reviewStartY = data.rating
    ? authorY + (isLandscape ? 70 : 100)
    : authorY + (isLandscape ? 36 : 50)

  if (data.review) {
    drawWaveDivider(ctx, pad + 40, reviewStartY - 16, w - pad * 2 - 80)

    // Opening quotation mark (decorative large)
    ctx.fillStyle = C.copper
    ctx.globalAlpha = 0.25
    ctx.font = `700 ${isLandscape ? 80 : 120}px 'Lora', Georgia, serif`
    ctx.fillText('\u201C', pad + 14, reviewStartY + (isLandscape ? 40 : 60))
    ctx.globalAlpha = 1

    ctx.fillStyle = C.espresso
    ctx.font = `italic ${isLandscape ? 18 : 22}px 'Lora', Georgia, serif`
    wrapText(
      ctx,
      data.review,
      pad + 50,
      reviewStartY + (isLandscape ? 20 : 30),
      w - pad * 2 - 100,
      isLandscape ? 26 : 32,
      isStory ? 8 : isLandscape ? 3 : 5,
    )
  }

  // ── Pages badge ──
  if (data.pagesRead) {
    const badgeY = h - pad - (isLandscape ? 50 : 65)
    const badgeText = `${data.pagesRead} pages`

    ctx.font = `500 ${isLandscape ? 14 : 16}px 'Inter', system-ui, sans-serif`
    const measuredW = ctx.measureText(badgeText).width + 28
    roundRect(ctx, pad + 30, badgeY - 12, measuredW, isLandscape ? 28 : 32, 14)
    ctx.fillStyle = C.warmWhite
    ctx.fill()
    ctx.strokeStyle = C.sand
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = C.walnut
    ctx.textAlign = 'left'
    ctx.fillText(badgeText, pad + 44, badgeY + (isLandscape ? 6 : 8))
  }

  drawBranding(ctx, w, h, pad + 20, isLandscape ? 0.85 : 1)

  return canvas
}

// ── Utilities ────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}k`
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/png',
    )
  })
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
