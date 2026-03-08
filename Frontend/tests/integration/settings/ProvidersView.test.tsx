import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import ProvidersView from '../../../src/components/settings/sections/providers/ProvidersView'
import { server } from '../../mocks/server'
import { withAuth } from '../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('ProvidersView', () => {
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    expect(screen.getByText('Loading providers...')).toBeInTheDocument()
  })

  it('renders provider names after loading', async () => {
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    expect(await screen.findByText('ollama')).toBeInTheDocument()
    expect(screen.getByText('openai')).toBeInTheDocument()
  })

  it('shows error when providers API fails', async () => {
    server.use(
      http.get(
        '/api/settings/providers',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    expect(await screen.findByText(/Error/i)).toBeInTheDocument()
  })
})

describe('ProvidersView – API key section', () => {
  it('shows "API key added" for a provider that has an API key', async () => {
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    expect(await screen.findByText('API key added')).toBeInTheDocument()
  })

  it('shows "Remove API key" button for a provider with an API key', async () => {
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    expect(
      await screen.findByRole('button', { name: 'Remove API key' }),
    ).toBeInTheDocument()
  })

  it('shows "Add API key" button for a provider without an API key', async () => {
    server.use(
      http.get(
        '/api/settings/providers',
        withAuth(() =>
          HttpResponse.json([
            {
              name: 'openai',
              requires_api_key: true,
              has_api_key: false,
            },
          ]),
        ),
      ),
    )
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    expect(
      await screen.findByRole('button', { name: /Add API key/i }),
    ).toBeInTheDocument()
  })

  it('clicking "Add API key" reveals the key input form', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        '/api/settings/providers',
        withAuth(() =>
          HttpResponse.json([
            {
              name: 'openai',
              requires_api_key: true,
              has_api_key: false,
            },
          ]),
        ),
      ),
    )
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    await user.click(
      await screen.findByRole('button', { name: /Add API key/i }),
    )
    expect(
      screen.getByPlaceholderText('Enter your API key'),
    ).toBeInTheDocument()
  })

  it('submitting an empty API key shows a validation error', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        '/api/settings/providers',
        withAuth(() =>
          HttpResponse.json([
            {
              name: 'openai',
              requires_api_key: true,
              has_api_key: false,
            },
          ]),
        ),
      ),
    )
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    await user.click(
      await screen.findByRole('button', { name: /Add API key/i }),
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(
      await screen.findByText('API key cannot be empty'),
    ).toBeInTheDocument()
  })

  it('submitting a valid API key calls the API and closes the form', async () => {
    const user = userEvent.setup()
    let apiKeySent = ''
    server.use(
      http.get(
        '/api/settings/providers',
        withAuth(() =>
          HttpResponse.json([
            {
              name: 'openai',
              requires_api_key: true,
              has_api_key: false,
            },
          ]),
        ),
      ),
      http.post(
        '/api/settings/providers/:name/api-key',
        withAuth(async ({ request }) => {
          const body = (await request.json()) as { api_key: string }
          apiKeySent = body.api_key
          return new HttpResponse(null, { status: 200 })
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    await user.click(
      await screen.findByRole('button', { name: /Add API key/i }),
    )
    await user.type(
      screen.getByPlaceholderText('Enter your API key'),
      'sk-test-123',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(apiKeySent).toBe('sk-test-123'))
  })

  it('clicking "Remove API key" calls the DELETE endpoint', async () => {
    const user = userEvent.setup()
    let deleteCalled = false
    server.use(
      http.delete(
        '/api/settings/providers/:name/api-key',
        withAuth(() => {
          deleteCalled = true
          return new HttpResponse(null, { status: 204 })
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ProvidersView />)
    await user.click(
      await screen.findByRole('button', { name: 'Remove API key' }),
    )
    await waitFor(() => expect(deleteCalled).toBe(true))
  })
})
