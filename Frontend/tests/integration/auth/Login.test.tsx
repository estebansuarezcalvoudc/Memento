import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import LogIn from '../../../src/pages/auth/LogIn'
import SignUp from '../../../src/pages/auth/SignUp'
import { server } from '../../mocks/server'
import { renderWithRouter, setupStoreReset } from '../../utils'

setupStoreReset()

describe('LogIn Page', () => {
  afterEach(() => {
    localStorage.removeItem('access_token')
  })

  it('renders the login form correctly', () => {
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LogIn />} />
      </Routes>,
      { route: '/login' },
    )

    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByLabelText('password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('shows validation errors with empty fields', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LogIn />} />
      </Routes>,
      { route: '/login' },
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('You must provide your email'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('You must provide your password'),
    ).toBeInTheDocument()
  })

  it('successful login stores token and navigates to home', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LogIn />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>,
      { route: '/login' },
    )

    await user.type(screen.getByLabelText('email'), 'test@example.com')
    await user.type(screen.getByLabelText('password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await screen.findByText('Home Page')
    expect(localStorage.getItem('access_token')).toBe('fake-token')
  })

  it('shows error message when the API fails', async () => {
    server.use(
      http.post('/api/auth/token', () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    )
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LogIn />} />
      </Routes>,
      { route: '/login' },
    )

    await user.type(screen.getByLabelText('email'), 'test@example.com')
    await user.type(screen.getByLabelText('password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await screen.findByText(/HTTP error/i)
  })

  it('has a link to the sign up page that navigates correctly', async () => {
    const user = userEvent.setup()
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>,
      { route: '/login' },
    )

    const signUpLink = screen.getByRole('link', { name: 'Create an account' })
    expect(signUpLink).toBeInTheDocument()

    await user.click(signUpLink)
    await screen.findByRole('button', { name: 'Sign up' })
  })
})
