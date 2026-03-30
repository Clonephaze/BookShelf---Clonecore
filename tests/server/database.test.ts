// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => vi.fn()),
}))

vi.mock('drizzle-orm/neon-http', () => ({
  drizzle: vi.fn(() => ({ __mockDb: true })),
}))

describe('useDB', () => {
  const originalUrl = process.env.DATABASE_URL

  beforeEach(() => {
    vi.resetModules()
    delete process.env.DATABASE_URL
  })

  afterEach(() => {
    if (originalUrl !== undefined) {
      process.env.DATABASE_URL = originalUrl
    } else {
      delete process.env.DATABASE_URL
    }
  })

  it('throws when DATABASE_URL is not defined', async () => {
    const { useDB } = await import('../../server/database/index')
    expect(() => useDB()).toThrow('DATABASE_URL is not set')
  })

  it('returns a database instance when DATABASE_URL is configured', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
    const { useDB } = await import('../../server/database/index')
    const db = useDB()
    expect(db).toBeDefined()
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
    const { useDB } = await import('../../server/database/index')
    const db1 = useDB()
    const db2 = useDB()
    expect(db1).toBe(db2)
  })
})
