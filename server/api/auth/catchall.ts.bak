import { useAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  return useAuth().handler(toWebRequest(event))
})
