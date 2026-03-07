import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import ChatView from '../../../../src/components/settings/sections/chat/ChatView'
import { server } from '../../../mocks/server'
import { withAuth } from '../../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../../utils'

setupStoreReset()

// Both sections share the same available-models list for these tests
const AVAILABLE_MODELS = [
  { id: 'llama3.2:latest', provider: 'Ollama' },
  { id: 'gpt-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', provider: 'OpenAI' },
]

beforeEach(() => {
  server.use(
    http.get(
      '/api/settings/models/available',
      withAuth(() => HttpResponse.json(AVAILABLE_MODELS)),
    ),
  )
})

// Helper: wait for both sections to finish loading and return each section's
// container element (the wrapping div rendered by ModelConfigSection).
// We locate each section by its <h2> heading, then walk up to the nearest
// ancestor that also contains the Model <select>.
async function getSections() {
  const chatHeading = await screen.findByRole('heading', { name: 'Chat Model' })
  const retrievalHeading = screen.getByRole('heading', {
    name: 'Retrieval Model',
  })
  const chatSection = chatHeading.closest('div') as HTMLElement
  const retrievalSection = retrievalHeading.closest('div') as HTMLElement
  return { chatSection, retrievalSection }
}

describe('ChatView', () => {
  it('renders the Chat Model subsection title', async () => {
    setAuthToken()
    renderWithRouter(<ChatView />)
    expect(
      await screen.findByRole('heading', { name: 'Chat Model' }),
    ).toBeInTheDocument()
  })

  it('renders the Retrieval Model subsection title', async () => {
    setAuthToken()
    renderWithRouter(<ChatView />)
    expect(
      await screen.findByRole('heading', { name: 'Retrieval Model' }),
    ).toBeInTheDocument()
  })

  it('each section shows its own configured model', async () => {
    setAuthToken()
    renderWithRouter(<ChatView />)
    const { chatSection, retrievalSection } = await getSections()
    await waitFor(() => {
      expect(within(chatSection).getByLabelText('Model')).toHaveValue(
        'llama3.2:latest',
      )
      expect(within(retrievalSection).getByLabelText('Model')).toHaveValue(
        'gpt-4o',
      )
    })
  })

  it('changing the model in Chat Model does not affect Retrieval Model', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatView />)
    const { chatSection, retrievalSection } = await getSections()
    await waitFor(() =>
      expect(within(retrievalSection).getByLabelText('Model')).toHaveValue(
        'gpt-4o',
      ),
    )
    await user.selectOptions(
      within(chatSection).getByLabelText('Model'),
      'gpt-4o-mini',
    )
    expect(within(chatSection).getByLabelText('Model')).toHaveValue(
      'gpt-4o-mini',
    )
    expect(within(retrievalSection).getByLabelText('Model')).toHaveValue(
      'gpt-4o',
    )
  })

  it('changing the model in Retrieval Model does not affect Chat Model', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatView />)
    const { chatSection, retrievalSection } = await getSections()
    await waitFor(() =>
      expect(within(chatSection).getByLabelText('Model')).toHaveValue(
        'llama3.2:latest',
      ),
    )
    await user.selectOptions(
      within(retrievalSection).getByLabelText('Model'),
      'gpt-4o-mini',
    )
    expect(within(retrievalSection).getByLabelText('Model')).toHaveValue(
      'gpt-4o-mini',
    )
    expect(within(chatSection).getByLabelText('Model')).toHaveValue(
      'llama3.2:latest',
    )
  })

  it('saving Chat Model calls PUT /models/chat and not PUT /models/retrieval', async () => {
    const user = userEvent.setup()
    let retrievalPutCalled = false
    server.use(
      http.put(
        '/api/settings/models/retrieval',
        withAuth(async ({ request }) => {
          retrievalPutCalled = true
          return HttpResponse.json(await request.json())
        }),
      ),
    )
    let chatPutBody: unknown
    server.use(
      http.put(
        '/api/settings/models/chat',
        withAuth(async ({ request }) => {
          chatPutBody = await request.json()
          return HttpResponse.json(await request.clone().json())
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ChatView />)
    const { chatSection } = await getSections()
    await waitFor(() =>
      expect(within(chatSection).getByLabelText('Model')).toHaveValue(
        'llama3.2:latest',
      ),
    )
    await user.selectOptions(
      within(chatSection).getByLabelText('Model'),
      'gpt-4o-mini',
    )
    await user.click(within(chatSection).getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(chatPutBody).toMatchObject({ model_name: 'gpt-4o-mini' }),
    )
    expect(retrievalPutCalled).toBe(false)
  })
})
