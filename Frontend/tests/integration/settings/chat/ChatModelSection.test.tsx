import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import ChatModelSection from '../../../../src/components/settings/sections/chat/ChatModelSection'
import RetrievalModelSection from '../../../../src/components/settings/sections/chat/RetrievalModelSection'
import { server } from '../../../mocks/server'
import { withAuth } from '../../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../../utils'

setupStoreReset()

const AVAILABLE_MODELS = [
  { id: 'llama3.2:latest', provider: 'Ollama' },
  { id: 'gpt-4o', provider: 'OpenAI' },
]

beforeEach(() => {
  server.use(
    http.get(
      '/api/settings/models/available',
      withAuth(() => HttpResponse.json(AVAILABLE_MODELS)),
    ),
  )
})

describe('ChatModelSection', () => {
  it('loads and displays the configured chat model from the API', async () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model')).toHaveValue('llama3.2:latest'),
    )
  })

  it('calls PUT /api/settings/models/chat when saving', async () => {
    const user = userEvent.setup()
    let capturedBody: unknown
    server.use(
      http.get(
        '/api/settings/models/available',
        withAuth(() => HttpResponse.json(AVAILABLE_MODELS)),
      ),
      http.put(
        '/api/settings/models/chat',
        withAuth(async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(await request.clone().json())
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(capturedBody).toMatchObject({
        model_name: 'gpt-4o',
        provider: 'OpenAI',
      }),
    )
  })
})

describe('RetrievalModelSection', () => {
  it('loads and displays the configured retrieval model from the API', async () => {
    setAuthToken()
    renderWithRouter(<RetrievalModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model')).toHaveValue('gpt-4o'),
    )
  })

  it('calls PUT /api/settings/models/retrieval when saving', async () => {
    const user = userEvent.setup()
    let capturedBody: unknown
    server.use(
      http.put(
        '/api/settings/models/retrieval',
        withAuth(async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(await request.clone().json())
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<RetrievalModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3.2:latest')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(capturedBody).toMatchObject({
        model_name: 'llama3.2:latest',
        provider: 'Ollama',
      }),
    )
  })
})
