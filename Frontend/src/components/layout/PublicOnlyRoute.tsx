import { Navigate, Outlet } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'

import { useIsAuthInitialized, useIsUserAuth } from '../../stores/authStore'

export default function PublicOnlyRoute() {
  const authInitialized = useIsAuthInitialized()
  const isUserAuth = useIsUserAuth()

  if (!authInitialized) {
    return (
      <div
        aria-label="Loading"
        className="flex h-screen items-center justify-center"
      >
        <ClipLoader />
      </div>
    )
  }

  return isUserAuth ? <Navigate to="/" replace /> : <Outlet />
}
