// In-memory store for dev-only data (reset links, etc.)
// Only populated when BOOKSHELF_DEV=true

const store = new Map<string, string>()

export function setDevData(key: string, value: string) {
  if (process.env.BOOKSHELF_DEV !== 'true') return
  store.set(key, value)
}

export function getDevData(key: string): string | undefined {
  if (process.env.BOOKSHELF_DEV !== 'true') return undefined
  return store.get(key)
}

export function clearDevData(key: string) {
  store.delete(key)
}
