import { useDB } from '../database'
import { activityLog } from '../database/schema'

export type ActivityAction = 'added_book' | 'started_reading' | 'finished_reading' | 'rated_book' | 'hit_goal'

interface LogActivityOptions {
  userId: string
  action: ActivityAction
  userBookId?: string
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget activity logging.
 * Never throws — activity is non-critical.
 */
export async function logActivity(opts: LogActivityOptions) {
  try {
    const db = useDB()
    await db.insert(activityLog).values({
      userId: opts.userId,
      action: opts.action,
      userBookId: opts.userBookId ?? null,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    })
  }
  catch {
    // Silent — activity logging should never break the main flow
  }
}
