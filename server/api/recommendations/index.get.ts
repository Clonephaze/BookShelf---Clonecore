import { requireServerSession } from '../../utils/session'
import { getRecommendations } from '../../services/recommendations'

export default defineEventHandler(async (event) => {
  const session = await requireServerSession(event)
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50)

  const recommendations = await getRecommendations(session.user.id, limit)
  return recommendations
})
