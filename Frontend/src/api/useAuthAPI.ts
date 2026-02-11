import { useCallback } from 'react'

import fetchBackend from './fetchBackend'

export interface Token {
  access_token: string
  token_type: string
}

export default function useAuthAPI() {
  const login = useCallback(
    async (email: string, password: string): Promise<Token> => {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      return fetchBackend('POST', 'auth/token', formData)
    },
    [],
  )

  const register = useCallback(
    async (email: string, password: string): Promise<Token> =>
      fetchBackend('POST', 'auth/register', {
        username: email,
        password,
      }),
    [],
  )

  return {
    login,
    register,
  }
}
