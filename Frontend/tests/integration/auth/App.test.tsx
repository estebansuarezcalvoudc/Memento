import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'
import { ClipLoader } from 'react-spinners'
import { describe, expect, it } from 'vitest'

import { verifyToken } from '../../../src/api/authAPI'
import {
  _useAuthStore,
  useIsAuthInitialized,
  useSetAuthInitialized,
  useSetIsUserAuth,
} from '../../../src/stores/authStore'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

// Renders the top-level loading screen logic from App.tsx.
// The useEffect is omitted here — it is already tested in AuthGuard.test.tsx.
// This component only tests the rendering branch based on store state.
function AppShell({ children }: { children: React.ReactNode }) {
  const authInitialized = useIsAuthInitialized()

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

  return <>{children}</>
}

// Variant that includes the initialization effect, mirroring App.tsx exactly.
function AppShellWithEffect({ children }: { children: React.ReactNode }) {
  const authInitialized = useIsAuthInitialized()
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
  }, [setIsUserAuth, setAuthInitialized])

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

  return <>{children}</>
}

describe('App top-level loading screen', () => {
  it('shows a spinner when authInitialized is false', () => {
    // Store is reset to authInitialized: false by setupStoreReset
    renderWithRouter(
      <AppShell>
        <div>Page content</div>
      </AppShell>,
    )

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Page content')).not.toBeInTheDocument()
  })

  it('hides the spinner and shows content when authInitialized transitions to true', async () => {
    // Start with spinner visible
    renderWithRouter(
      <AppShell>
        <div>Page content</div>
      </AppShell>,
    )
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()

    // Simulate auth resolving — Zustand triggers a re-render automatically
    act(() => {
      _useAuthStore.setState({ authInitialized: true })
    })

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('shows a spinner while verifyToken is in flight and hides it once resolved', async () => {
    setAuthToken()

    renderWithRouter(
      <AppShellWithEffect>
        <div>Page content</div>
      </AppShellWithEffect>,
    )

    // Spinner visible while GET /api/auth/me is pending
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Page content')).not.toBeInTheDocument()

    // After the MSW handler responds, auth is initialized and spinner is gone
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('hides the spinner even when the token is invalid', async () => {
    setAuthToken('invalid-token')

    server.use(
      http.get('/api/auth/me', () => new HttpResponse(null, { status: 401 })),
    )

    renderWithRouter(
      <AppShellWithEffect>
        <div>Page content</div>
      </AppShellWithEffect>,
    )

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('does not show the spinner when authInitialized is already true', () => {
    _useAuthStore.setState({ authInitialized: true, isUserAuth: false })

    renderWithRouter(
      <AppShell>
        <div>Page content</div>
      </AppShell>,
    )

    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
