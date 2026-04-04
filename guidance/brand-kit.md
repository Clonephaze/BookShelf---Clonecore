# Brand Kit: Bookshelf

## Mood & Tone

**Warm, literary, refined.** The UI feels like a well-curated independent bookstore — inviting, considered, and quietly beautiful. Every screen should feel like a place you want to linger.

- Warm but not rustic
- Refined but not pretentious
- Cozy but not cluttered
- Expressive but not loud

This is a tool for people who love books. It should feel like a reading nook with good lighting — comfortable, personal, and designed for focus.

## Design Inspiration

Explore these products for inspiration — they solve similar problems with different design approaches:

- [Literal](https://literal.club) — Clean, modern book tracking with beautiful cover art presentation and a social layer. Draw from: book cover presentation, shelf layouts, reading progress UI.
- [Oku](https://oku.club) — Ultra-minimal, design-forward book tracker with a restrained, gallery-like aesthetic. Draw from: generous whitespace, elegant typography, calm browsing experience.
- [StoryGraph](https://www.thestorygraph.com) — Data-rich reading tracker focused on mood, pace, and statistics. Draw from: visual charts, reading analytics, the balance between data density and readability.
- [Spotify Wrapped](https://spotify.com/wrapped) — Not a book app, but essential inspiration for year-in-review. Draw from: narrative data storytelling, bold visuals, shareable card format.

There's no single right design for Bookshelf. These examples show the range of valid approaches — from data-rich dashboards to minimal gallery layouts. If you're going in your own design direction, spend some time exploring other book tracking apps and library interfaces to build your own reference library before you start building.

The `preview.jpg` in the repo root shows these tokens applied to Bookshelf's library view. Use it as a reference for how the brand kit comes together — it's a concept image, not a pixel-perfect spec.

## Color Palette

### Light Mode (Sepia-Warm)

Warm, papery tones inspired by e-reader sepia modes (Apple Books, Kindle). The default light theme feels like reading on aged parchment.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-primary` | `#F4EBDB` | Main background — warm parchment |
| `--color-bg-secondary` | `#EBE1CF` | Sidebar, card backgrounds |
| `--color-surface` | `#FAF5EB` | Cards, elevated surfaces — lightest cream |
| `--color-border` | `#D3C7B3` | Borders, dividers — warm tan |
| `--color-border-subtle` | `#E1D8C8` | Subtle separators |
| `--color-text-primary` | `#302318` | Headings, primary text — deep espresso brown |
| `--color-text-secondary` | `#5C4A38` | Body text, descriptions |
| `--color-text-tertiary` | `#8A7A66` | Metadata, timestamps, muted text |
| `--color-accent` | `#A0592A` | Primary actions, links — warm copper |
| `--color-accent-hover` | `#854921` | Hover on accent elements |
| `--color-accent-subtle` | `#F5EBD9` | Accent backgrounds, selected states |
| `--color-success` | `#3D7C4F` | Goal complete, book finished |
| `--color-warning` | `#B8860B` | Warnings, behind-pace indicators |
| `--color-error` | `#C0392B` | Errors, destructive actions |
| `--color-progress` | `#A0592A` | Reading progress bars and goal indicators |
| `--color-rating` | `#D4A03E` | Star ratings, warm gold |

### Dark Mode (Espresso)

Rich, neutral dark browns — deep chocolate/coffee tones without yellow-green cast. Warm accents provide contrast.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-primary` | `#141110` | Main background — deep espresso |
| `--color-bg-secondary` | `#1B1816` | Sidebar, card backgrounds |
| `--color-surface` | `#211D1A` | Cards, elevated surfaces |
| `--color-border` | `#382F29` | Borders, dividers |
| `--color-border-subtle` | `#2A2521` | Subtle separators |
| `--color-text-primary` | `#E8E1D8` | Headings, primary text — warm cream |
| `--color-text-secondary` | `#A69C91` | Body text, descriptions |
| `--color-text-tertiary` | `#706862` | Metadata, timestamps, muted text |
| `--color-accent` | `#C8844A` | Primary actions, links — warm amber |
| `--color-accent-hover` | `#D99A60` | Hover on accent elements |
| `--color-accent-subtle` | `#261D14` | Accent backgrounds, selected states |
| `--color-success` | `#5AAF6E` | Goal complete, book finished |
| `--color-warning` | `#D4A03E` | Warnings, behind-pace indicators |
| `--color-error` | `#E8614D` | Errors, destructive actions |
| `--color-progress` | `#C8844A` | Reading progress bars and goal indicators |
| `--color-rating` | `#E0B84A` | Star ratings, warm gold |

### OLED Mode (True Black)

True `#000` background for OLED screens. High contrast with warm accents — serves both accessibility and OLED battery optimization.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-primary` | `#000000` | Main background — true black |
| `--color-bg-secondary` | `#0C0A09` | Sidebar, card backgrounds — near-black |
| `--color-surface` | `#161311` | Cards, elevated surfaces |
| `--color-border` | `#2C2622` | Borders, dividers — warm-tinted |
| `--color-border-subtle` | `#1C1814` | Subtle separators |
| `--color-text-primary` | `#F0ECE6` | Headings, primary text — bright cream |
| `--color-text-secondary` | `#B8AFA5` | Body text, descriptions |
| `--color-text-tertiary` | `#78706A` | Metadata, timestamps, muted text |
| `--color-accent` | `#D4964A` | Primary actions, links — warm amber |
| `--color-accent-hover` | `#E0A85E` | Hover on accent elements |
| `--color-accent-subtle` | `#1A1408` | Accent backgrounds, selected states |
| `--color-success` | `#62B876` | Goal complete, book finished |
| `--color-warning` | `#D9AD48` | Warnings, behind-pace indicators |
| `--color-error` | `#ED6B57` | Errors, destructive actions |
| `--color-progress` | `#D4964A` | Reading progress bars and goal indicators |
| `--color-rating` | `#E5C050` | Star ratings, warm gold |

## Typography

### Font Stack

| Usage | Font | Fallback |
|-------|------|----------|
| Headings | `Lora` | `Georgia, 'Times New Roman', serif` |
| Body / UI | `Inter` | `system-ui, -apple-system, sans-serif` |
| Book descriptions / Notes | `Lora` | `Georgia, 'Times New Roman', serif` |
| Code (if needed) | `JetBrains Mono` | `'SF Mono', 'Fira Code', monospace` |

Lora is a well-balanced serif typeface with roots in calligraphy — it brings literary warmth to headings and long-form reading without feeling old-fashioned. Inter provides clean, modern UI text that pairs beautifully with a serif headline font. Together they create the "bookstore meets modern app" feel.

### Type Scale

Based on a 1.25 ratio (major third), anchored at 16px body.

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 11px / 0.6875rem | 400 | 1.45 | Metadata, timestamps, page counts |
| `--text-sm` | 13px / 0.8125rem | 400 | 1.45 | Secondary text, shelf labels, ISBN |
| `--text-base` | 16px / 1rem | 400 | 1.6 | Body text, book descriptions, UI text |
| `--text-lg` | 20px / 1.25rem | 500 | 1.4 | Book titles in lists, section headers |
| `--text-xl` | 25px / 1.5625rem | 600 | 1.3 | Page titles, shelf headings |
| `--text-2xl` | 31px / 1.9375rem | 600 | 1.25 | Hero subheading, book title in detail view |
| `--text-3xl` | 39px / 2.4375rem | 700 | 1.2 | Landing page hero heading |

### Line Heights

| Token | Value | Used with |
|-------|-------|-----------|
| `--leading-tight` | 1.2 | `--text-3xl` |
| `--leading-snug` | 1.25 | `--text-2xl` |
| `--leading-normal` | 1.3 | `--text-xl` |
| `--leading-relaxed` | 1.4 | `--text-lg` |
| `--leading-loose` | 1.45 | `--text-xs`, `--text-sm` |
| `--leading-prose` | 1.6 | `--text-base` (body text, descriptions) |

The type scale table above shows which line height each text size uses. In `tokens.css`, line heights are independent custom properties — pair them with text sizes as shown, or adjust as needed. Note the `--leading-prose` value at 1.6 — book descriptions and notes benefit from more generous line height than typical UI text.

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--font-regular` | 400 | Body text, descriptions, metadata |
| `--font-medium` | 500 | Book titles in lists, nav items, emphasis |
| `--font-semibold` | 600 | Section headings, buttons, shelf names |
| `--font-bold` | 700 | Hero headings, strong emphasis, stats callouts |

## Spacing

Based on a 4px base unit.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px / 0.25rem | Tight gaps, icon padding, star rating gaps |
| `--space-2` | 8px / 0.5rem | Inline spacing, small gaps, metadata spacing |
| `--space-3` | 12px / 0.75rem | Compact element spacing, book cover gaps in grid |
| `--space-4` | 16px / 1rem | Standard element spacing |
| `--space-5` | 20px / 1.25rem | Medium section gaps |
| `--space-6` | 24px / 1.5rem | Card padding, shelf section spacing |
| `--space-8` | 32px / 2rem | Section spacing |
| `--space-10` | 40px / 2.5rem | Large section gaps |
| `--space-12` | 48px / 3rem | Major section breaks |
| `--space-16` | 64px / 4rem | Page-level spacing |
| `--space-20` | 80px / 5rem | Hero spacing, large gaps |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.25rem | Small elements, badges, genre tags |
| `--radius-md` | 0.5rem | Buttons, inputs, search bar |
| `--radius-lg` | 0.75rem | Cards, shelf panels, modals |
| `--radius-xl` | 1rem | Large cards, feature sections, stat cards |
| `--radius-full` | 9999rem | Avatars, circular progress indicators |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(44,36,32,0.06)` | Subtle lift, book covers on hover |
| `--shadow-md` | `0 4px 8px -1px rgba(44,36,32,0.08), 0 2px 4px -2px rgba(44,36,32,0.04)` | Cards, dropdowns, shelf panels |
| `--shadow-lg` | `0 12px 20px -4px rgba(44,36,32,0.12), 0 4px 8px -4px rgba(44,36,32,0.06)` | Modals, book detail overlay, command palette |
| `--shadow-book` | `0 2px 8px rgba(44,36,32,0.15), 0 1px 3px rgba(44,36,32,0.1)` | Book cover shadows — slightly stronger to give covers a "standing" feel |

In dark mode, shadow opacities increase for visibility on dark backgrounds:

| Token | Dark Mode Value |
|-------|----------------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 8px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.25)` |
| `--shadow-lg` | `0 12px 20px -4px rgba(0,0,0,0.5), 0 4px 8px -4px rgba(0,0,0,0.3)` |
| `--shadow-book` | `0 2px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)` |

## Icons & Visual Assets

### Icons

| Recommendation | Alternatives |
|---------------|-------------|
| **Lucide** — Clean, consistent, pairs well with Inter for UI elements. The thin stroke style creates a refined feel that matches the literary aesthetic. | Phosphor (flexible weights — heavier weights feel cozier), Heroicons (Tailwind ecosystem) |

Use icons for navigation, actions (add to shelf, rate, update progress, search), shelf indicators, and empty states. Keep sizes consistent — 16px for inline/metadata, 20px for UI actions, 24px for navigation.

### Images

Bookshelf is visually driven by book covers — most visual richness comes from the books themselves. Your landing page may benefit from a hero illustration or carefully composed screenshot showing the product with real book covers, but stock photography isn't essential.

For placeholder book covers (when the API returns no cover image): design a tasteful placeholder that includes the book title and author name in the brand typography. This is better than a generic "no image" icon — it maintains the visual rhythm of the shelf.

If you need supplementary images: [Unsplash](https://unsplash.com) for photography (search "books", "reading", "library" for atmospheric shots).

### App Favicon

Ship a custom favicon. Consider a simple book or bookshelf icon in the accent color. An SVG favicon works across all modern browsers.

## Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 15rem | Navigation sidebar (shelves, search, stats) |
| `--content-max-width` | 48rem | Book detail view, reading notes |
| `--library-max-width` | 72rem | Library grid view, shelf browse |
| `--page-max-width` | 80rem | Overall page container |

## Key Screens for Design Quality

These are the screens where design taste will be most visible. Pay special attention to typography, spacing, and visual hierarchy:

1. **Library / shelf view** — Where users spend 80% of their time. Book cover grids need visual rhythm, consistent spacing, and clear hierarchy between shelf sections. The interplay between covers, titles, and metadata defines the product's character.
2. **Year-in-review / statistics** — The most shareable screen. Data visualization, bold typography, and a distinct visual treatment that feels like a special moment — not just another page with charts.
3. **Landing page** — First impression. Book covers should be prominently featured to immediately communicate what the product is. The warm, literary aesthetic should be evident within 2 seconds.

## Quality Spectrum

| Level | What it looks like for Bookshelf |
|-------|--------------------------------|
| **Adequate** | Books display with covers, shelves work, navigation is functional. Consistent spacing and color usage. Looks like a developer's side project — functional but the covers do most of the visual heavy lifting. |
| **Good** | Thoughtful book cover grid with consistent aspect ratios and spacing. Serif headings create a literary feel. Progress indicators are well-designed. Empty states are considered. Hover interactions on covers add depth. Looks like an early-stage product. |
| **Excellent** | Every screen feels curated. Book covers have subtle shadows and hover effects that feel tactile. The year-in-review is a genuine design achievement — bold, beautiful, shareable. The landing page makes someone say "wait, this isn't a real product?" Typography hierarchy between Lora headings and Inter body text creates a distinctive, warm personality. Micro-interactions add polish without distraction. Looks like something you'd recommend to a friend. |
