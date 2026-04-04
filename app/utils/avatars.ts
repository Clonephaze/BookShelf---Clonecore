export interface Avatar {
  id: string
  label: string
  src: string
}

export const avatars: Avatar[] = [
  { id: 'owl', label: 'Wise Owl', src: '/avatars/owl.svg' },
  { id: 'cat', label: 'Cozy Cat', src: '/avatars/cat.svg' },
  { id: 'fox', label: 'Clever Fox', src: '/avatars/fox.svg' },
  { id: 'coffee', label: 'Coffee Lover', src: '/avatars/coffee.svg' },
  { id: 'books', label: 'Book Stack', src: '/avatars/books.svg' },
  { id: 'moon', label: 'Night Reader', src: '/avatars/moon.svg' },
  { id: 'plant', label: 'Book Sprout', src: '/avatars/plant.svg' },
  { id: 'glasses', label: 'Bookworm', src: '/avatars/glasses.svg' },
  { id: 'bookmark', label: 'Bookmark', src: '/avatars/bookmark.svg' },
  { id: 'lamp', label: 'Reading Lamp', src: '/avatars/lamp.svg' },
]

export const avatarIds = avatars.map(a => a.id)

const avatarMap = new Map(avatars.map(a => [a.id, a]))

export function getAvatar(id: string | null | undefined): Avatar | undefined {
  if (!id) return undefined
  return avatarMap.get(id)
}
