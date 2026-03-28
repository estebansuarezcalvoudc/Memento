import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { clearAuthSession } from '../../auth/session'
import { useSetIsUserAuth } from '../../stores/authStore'

export default function AuthGuard() {
  const setIsUserAuth = useSetIsUserAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession()
      setIsUserAuth(false)
      navigate('/login')
    }

    window.addEventListener('unauthorized', handleUnauthorized)
    return () => window.removeEventListener('unauthorized', handleUnauthorized)
  }, [setIsUserAuth, navigate])

  return null
}
