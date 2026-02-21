import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import LogIn from '../../../src/pages/auth/LogIn'
import SignUp from '../../../src/pages/auth/SignUp'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('SignUp Page', () => {
  beforeEach(() => {
    // fetchBackend requires a token even for auth endpoints
    setAuthToken('dummy')
  })

  afterEach(() => {
    localStorage.removeItem('access_token')
  })

  it('renders the sign up form correctly', () => {
    renderWithRouter(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' },
    )

    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByLabelText('password')).toBeInTheDocument()
    expect(screen.getByLabelText('confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
  })

  it('shows validation errors with empty fields', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' },
    )

    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(
      await screen.findByText('You must provide your email'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('You must provide your password'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('You must confirm your password'),
    ).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' },
    )

    await user.type(screen.getByLabelText('email'), 'test@example.com')
    await user.type(screen.getByLabelText('password'), 'password123')
    await user.type(screen.getByLabelText('confirm password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(
      await screen.findByText('Provided passwords do not match'),
    ).toBeInTheDocument()
  })

  it('successful sign up stores token and navigates to home', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>,
      { route: '/signup' },
    )

    await user.type(screen.getByLabelText('email'), 'test@example.com')
    await user.type(screen.getByLabelText('password'), 'password123')
    await user.type(screen.getByLabelText('confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    await screen.findByText('Home Page')
    expect(localStorage.getItem('access_token')).toBe('fake-token')
  })

  it('shows error message when the API fails', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/signup' },
    )

    await user.type(screen.getByLabelText('email'), 'existing@example.com')
    await user.type(screen.getByLabelText('password'), 'password123')
    await user.type(screen.getByLabelText('confirm password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    await screen.findByText(/HTTP error/i)
  })

  it('has a link to the login page that navigates correctly', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
      </Routes>,
      { route: '/signup' },
    )

    const loginLink = screen.getByRole('link', { name: 'Log in' })
    expect(loginLink).toBeInTheDocument()

    await user.click(loginLink)
    await screen.findByRole('button', { name: 'Sign in' })
  })
})
