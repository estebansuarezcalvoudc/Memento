import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import AccountView from '../../../src/components/settings/sections/account/AccountView'
import { NEW_AUTH_TOKEN } from '../../mocks/authHandlers'
import { server } from '../../mocks/server'
import { withAuth } from '../../mocks/withAuth'
import { renderWithRouter, setupStoreReset } from '../../utils'

const TEST_EMAIL = 'test@example.com'
const TEST_TOKEN = `h.${btoa(JSON.stringify({ sub: TEST_EMAIL }))}.s`

function setup() {
  localStorage.setItem('access_token', TEST_TOKEN)
  return { user: userEvent.setup() }
}

setupStoreReset()

afterEach(() => {
  localStorage.removeItem('access_token')
})

describe('AccountView', () => {
  it('renders the username decoded from the JWT token', () => {
    setup()

    renderWithRouter(<AccountView />)

    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument()
  })

  it('shows "Edit email" and "Change password" buttons', () => {
    setup()

    renderWithRouter(<AccountView />)

    expect(
      screen.getByRole('button', { name: 'Edit email' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Change password' }),
    ).toBeInTheDocument()
  })

  it('clicking "Edit email" hides the action buttons and shows the email form', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)

    await user.click(screen.getByRole('button', { name: 'Edit email' }))

    expect(
      screen.queryByRole('button', { name: 'Edit email' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change password' }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('New email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('clicking "Change password" hides the action buttons and shows the password form', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)

    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(
      screen.queryByRole('button', { name: 'Edit email' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change password' }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Current password')).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
  })
})

describe('AccountView – Update email form', () => {
  it('submitting with an empty email shows a validation error', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Edit email' }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('New email cannot be empty'),
    ).toBeInTheDocument()
  })

  it('submitting with an empty password shows a validation error', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Edit email' }))

    await user.type(screen.getByLabelText('New email'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Password cannot be empty'),
    ).toBeInTheDocument()
  })

  it('clicking Cancel closes the form and restores the action buttons', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Edit email' }))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('button', { name: 'Edit email' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Change password' }),
    ).toBeInTheDocument()
  })

  it('successful submission updates the displayed email and stores the new token', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Edit email' }))

    await user.type(screen.getByLabelText('New email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText(/new@example\.com/)
    expect(localStorage.getItem('access_token')).toBe(NEW_AUTH_TOKEN)
  })

  it('API error shows the message returned by the backend', async () => {
    server.use(
      http.patch(
        '/api/auth/username',
        withAuth(() =>
          HttpResponse.json(
            { detail: 'A user with this username already exists' },
            { status: 400 },
          ),
        ),
      ),
    )
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Edit email' }))

    await user.type(screen.getByLabelText('New email'), 'taken@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('A user with this username already exists'),
    ).toBeInTheDocument()
  })
})

describe('AccountView – Update password form', () => {
  it('submitting with an empty current password shows a validation error', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('Current password cannot be empty'),
    ).toBeInTheDocument()
  })

  it('submitting with an empty new password shows a validation error', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await user.type(screen.getByLabelText('Current password'), 'old-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('New password cannot be empty'),
    ).toBeInTheDocument()
  })

  it('submitting with non-matching passwords shows a validation error', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await user.type(screen.getByLabelText('Current password'), 'old-secret')
    await user.type(screen.getByLabelText('New password'), 'new-secret')
    await user.type(screen.getByLabelText('Confirm new password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('New passwords do not match'),
    ).toBeInTheDocument()
  })

  it('clicking Cancel closes the form and restores the action buttons', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('button', { name: 'Edit email' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Change password' }),
    ).toBeInTheDocument()
  })

  it('successful submission closes the form and restores the action buttons', async () => {
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await user.type(screen.getByLabelText('Current password'), 'old-secret')
    await user.type(screen.getByLabelText('New password'), 'new-secret')
    await user.type(screen.getByLabelText('Confirm new password'), 'new-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Change password' }),
      ).toBeInTheDocument(),
    )
  })

  it('API error shows the message returned by the backend', async () => {
    server.use(
      http.patch(
        '/api/auth/password',
        withAuth(() =>
          HttpResponse.json({ detail: 'Incorrect password' }, { status: 401 }),
        ),
      ),
    )
    const { user } = setup()
    renderWithRouter(<AccountView />)
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    await user.type(screen.getByLabelText('Current password'), 'wrong')
    await user.type(screen.getByLabelText('New password'), 'new-secret')
    await user.type(screen.getByLabelText('Confirm new password'), 'new-secret')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Incorrect password')).toBeInTheDocument()
  })
})
