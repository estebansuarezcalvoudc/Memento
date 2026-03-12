import { Navigate, Outlet } from 'react-router-dom'

import { useIsUserAuth } from '../../stores/authStore'

export default function ProtectedRoute() {
  const isUserAuth = useIsUserAuth()

  return isUserAuth ? <Outlet /> : <Navigate to="/login" replace />
}
