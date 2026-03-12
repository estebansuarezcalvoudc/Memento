import { Navigate, Outlet } from 'react-router-dom'

import { useIsUserAuth } from '../../stores/authStore'

export default function PublicOnlyRoute() {
  const isUserAuth = useIsUserAuth()

  return isUserAuth ? <Navigate to="/" replace /> : <Outlet />
}
