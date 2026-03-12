import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ProtectedRoute from '../../../src/components/layout/ProtectedRoute'
import PublicOnlyRoute from '../../../src/components/layout/PublicOnlyRoute'
import { _useAuthStore } from '../../../src/stores/authStore'
import { renderWithRouter, setupStoreReset } from '../../utils'

setupStoreReset()

// Helper: renders a guard wrapping a dummy child route and an optional target route
function renderProtectedRoute(route = '/protected') {
  return renderWithRouter(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/protected" element={<div>Protected content</div>} />
      </Route>
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { route },
  )
}

function renderPublicOnlyRoute(route = '/login') {
  return renderWithRouter(
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<div>Login page</div>} />
      </Route>
      <Route path="/" element={<div>Home page</div>} />
    </Routes>,
    { route },
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    _useAuthStore.setState({ authInitialized: true, isUserAuth: false })

    renderProtectedRoute()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders the child route when authenticated', () => {
    _useAuthStore.setState({ authInitialized: true, isUserAuth: true })

    renderProtectedRoute()

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  it('redirects to / when already authenticated', () => {
    _useAuthStore.setState({ authInitialized: true, isUserAuth: true })

    renderPublicOnlyRoute()

    expect(screen.getByText('Home page')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })

  it('renders the child route when not authenticated', () => {
    _useAuthStore.setState({ authInitialized: true, isUserAuth: false })

    renderPublicOnlyRoute()

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Home page')).not.toBeInTheDocument()
  })
})
