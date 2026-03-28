import { queryClient } from '../api/queryClient'

export function clearAuthSession() {
  localStorage.removeItem('access_token')
  queryClient.clear()
}
