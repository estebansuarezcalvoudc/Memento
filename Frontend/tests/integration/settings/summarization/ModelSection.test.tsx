import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import ModelSection from '../../../../src/components/settings/sections/summarization/ModelSection'
import { server } from '../../../mocks/server'
import { withAuth } from '../../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../../utils'

setupStoreReset()

describe('ModelSection', () => {
  it('loads and displays the configured summary model from the API', async () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model')).toHaveValue('gpt-4o'),
    )
  })

  it('calls PUT /api/settings/models/summary when saving', async () => {
    const user = userEvent.setup()
    let capturedBody: unknown
    server.use(
      http.put(
        '/api/settings/models/summary',
        withAuth(async ({ request }) => {
          capturedBody = await request.json()
          return HttpResponse.json(await request.clone().json())
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(capturedBody).toMatchObject({
        model_name: 'llama3',
        provider: 'ollama',
      }),
    )
  })
})
