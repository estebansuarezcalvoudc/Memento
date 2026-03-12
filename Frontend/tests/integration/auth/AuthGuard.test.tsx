import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { verifyToken } from '../../../src/api/authAPI'
import AuthGuard from '../../../src/components/layout/AuthGuard'
import {
  _getAuthState,
  _useAuthStore,
  useSetAuthInitialized,
  useSetIsUserAuth,
} from '../../../src/stores/authStore'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

// Replicates the initialization useEffect from App.tsx so it can be tested
// in isolation without mounting the full App (which uses BrowserRouter internally)
function AuthInitializer() {
  const setIsUserAuth = useSetIsUserAuth()
  const setAuthInitialized = useSetAuthInitialized()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      verifyToken()
        .then(() => setIsUserAuth(true))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setAuthInitialized(true))
    } else {
      setAuthInitialized(true)
    }
  }, [])

  return null
}

function renderAuthGuard() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/"
        element={
          <>
            <AuthGuard />
            <div>Home page</div>
          </>
        }
      />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { route: '/' },
  )
}

function renderWithAuthInit() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/"
        element={
          <>
            <AuthInitializer />
            <div>Home</div>
          </>
        }
      />
    </Routes>,
  )
}

describe('AuthGuard', () => {
  it('clears the token, resets auth state and navigates to /login on unauthorized event', async () => {
    setAuthToken()
    _useAuthStore.setState({ isUserAuth: true, authInitialized: true })

    renderAuthGuard()

    act(() => {
      window.dispatchEvent(new CustomEvent('unauthorized'))
    })

    await screen.findByText('Login page')
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(_getAuthState().isUserAuth).toBe(false)
  })
})

describe('verifyToken initialization', () => {
  it('sets authInitialized to true and isUserAuth to false when there is no token', async () => {
    renderWithAuthInit()

    await waitFor(() => {
      expect(_getAuthState().authInitialized).toBe(true)
      expect(_getAuthState().isUserAuth).toBe(false)
    })
  })

  it('sets isUserAuth to true and authInitialized to true when the token is valid', async () => {
    setAuthToken()

    renderWithAuthInit()

    // GET /api/auth/me is handled by the default authHandlers (withAuth → 200)
    await waitFor(() => {
      expect(_getAuthState().isUserAuth).toBe(true)
      expect(_getAuthState().authInitialized).toBe(true)
    })
  })

  it('clears the token and sets isUserAuth to false when the token is invalid', async () => {
    setAuthToken('invalid-token')

    server.use(
      http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })),
    )

    renderWithAuthInit()

    await waitFor(() => {
      expect(_getAuthState().isUserAuth).toBe(false)
      expect(_getAuthState().authInitialized).toBe(true)
      expect(localStorage.getItem('access_token')).toBeNull()
    })
  })
})
