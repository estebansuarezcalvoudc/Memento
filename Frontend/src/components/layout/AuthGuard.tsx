import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSetIsUserAuth } from '../../stores/authStore'

export default function AuthGuard() {
  const setIsUserAuth = useSetIsUserAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('access_token')
      setIsUserAuth(false)
      navigate('/login')
    }

    window.addEventListener('unauthorized', handleUnauthorized)
    return () => window.removeEventListener('unauthorized', handleUnauthorized)
  }, [])

  return null
}
