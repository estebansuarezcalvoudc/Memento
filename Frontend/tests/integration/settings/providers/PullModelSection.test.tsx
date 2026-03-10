import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import PullModelSection from '../../../../src/components/settings/sections/providers/pull-model/PullModelSection'
import { server } from '../../../mocks/server'
import { withAuth } from '../../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../../utils'

setupStoreReset()

describe('PullModelSection', () => {
  it('shows "Pull model" button initially', () => {
    setAuthToken()
    renderWithRouter(<PullModelSection providerName="Ollama" />)
    expect(screen.getByRole('button', { name: 'Pull model' })).toBeInTheDocument()
  })

  it('clicking "Pull model" reveals the model name input form', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<PullModelSection providerName="Ollama" />)
    await user.click(screen.getByRole('button', { name: 'Pull model' }))
    expect(screen.getByPlaceholderText('Enter the model name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('submitting an empty model name shows a validation error', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<PullModelSection providerName="Ollama" />)
    await user.click(screen.getByRole('button', { name: 'Pull model' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('Model cannot be empty')).toBeInTheDocument()
  })

  it('submitting a valid model name calls the pull endpoint and closes the form', async () => {
    const user = userEvent.setup()
    let requestBody: unknown = null
    server.use(
      http.post(
        '/api/settings/models/pull',
        withAuth(async ({ request }) => {
          requestBody = await request.json()
          return new HttpResponse(null, { status: 201 })
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<PullModelSection providerName="Ollama" />)
    await user.click(screen.getByRole('button', { name: 'Pull model' }))
    await user.type(screen.getByPlaceholderText('Enter the model name'), 'llama3.2:latest')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() =>
      expect(requestBody).toEqual({ provider: 'Ollama', model: 'llama3.2:latest' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Pull model' })).toBeInTheDocument(),
    )
  })

  it('clicking Cancel closes the form and returns to the initial state', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<PullModelSection providerName="Ollama" />)
    await user.click(screen.getByRole('button', { name: 'Pull model' }))
    expect(screen.getByPlaceholderText('Enter the model name')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Pull model' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Enter the model name')).not.toBeInTheDocument()
  })

  it('shows an error message when the pull endpoint returns an error', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(
        '/api/settings/models/pull',
        withAuth(() =>
          HttpResponse.json(
            { detail: 'Provider "OpenAI" cannot pull models' },
            { status: 400 },
          ),
        ),
      ),
    )
    setAuthToken()
    renderWithRouter(<PullModelSection providerName="Ollama" />)
    await user.click(screen.getByRole('button', { name: 'Pull model' }))
    await user.type(screen.getByPlaceholderText('Enter the model name'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(
      await screen.findByText('Provider "OpenAI" cannot pull models'),
    ).toBeInTheDocument()
  })
})
