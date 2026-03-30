import { useDB } from '../../database'
import { shelves } from '../../database/schema'
import { requireServerSession } from '../../utils/session'

const DEFAULT_SHELVES = [
  { name: 'Want to Read', slug: 'want-to-read', position: 0, isDefault: true, icon: 'bookmark' },
  { name: 'Currently Reading', slug: 'currently-reading', position: 1, isDefault: true, icon: 'book-open' },
  { name: 'Read', slug: 'read', position: 2, isDefault: true, icon: 'check-circle' },
]

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const db = useDB()
  const userId = session.user.id

  const inserted = await db
    .insert(shelves)
    .values(
      DEFAULT_SHELVES.map((shelf) => ({
        userId,
        name: shelf.name,
        slug: shelf.slug,
        position: shelf.position,
        isDefault: shelf.isDefault,
        icon: shelf.icon,
      })),
    )
    .onConflictDoNothing()
    .returning()

  return inserted
})
