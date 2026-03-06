import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import ChatModelSection from '../../../../src/components/settings/sections/chat/ChatModelSection'
import { server } from '../../../mocks/server'
import { withAuth } from '../../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../../utils'

setupStoreReset()

// Override available models for this suite so llama3.2:latest is selectable
beforeEach(() => {
  server.use(
    http.get(
      '/api/settings/models/available',
      withAuth(() =>
        HttpResponse.json([
          { id: 'llama3.2:latest', provider: 'Ollama' },
          { id: 'gpt-4o', provider: 'OpenAI' },
        ]),
      ),
    ),
  )
})

describe('ChatModelSection', () => {
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows the configured model in the select after loading', async () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model')).toHaveValue('llama3.2:latest'),
    )
  })

  it('shows available models as select options', async () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    expect(
      screen.getByRole('option', { name: /llama3\.2:latest/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /gpt-4o/ })).toBeInTheDocument()
  })

  it('shows the configured temperature value', async () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Temperature')).toHaveValue(0.7),
    )
  })

  it('shows the configured max tokens value', async () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Max tokens')).toHaveValue(2000),
    )
  })

  it('Save and Cancel are disabled while no edits have been made', async () => {
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('changing the model enables Save and Cancel', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled()
  })

  it('changing temperature enables Save', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Temperature')
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '1.2')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })

  it('Cancel resets the model to the original value', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Model')).toHaveValue('llama3.2:latest')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Save calls the PUT endpoint with the updated model config', async () => {
    const user = userEvent.setup()
    let capturedBody: unknown
    server.use(
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

  it('Save disables Save and Cancel on success', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    )
  })

  it('shows an error message when Save fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.put(
        '/api/settings/models/chat',
        withAuth(() => new HttpResponse(null, { status: 500 })),
      ),
    )
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4o')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      await screen.findByText('Failed to save. Please try again.'),
    ).toBeInTheDocument()
  })

  it('Save is disabled when no model is selected', async () => {
    server.use(
      http.get(
        '/api/settings/models/chat',
        withAuth(() =>
          HttpResponse.json({
            provider: '',
            model_name: '',
            temperature: 0.7,
            max_tokens: 2000,
          }),
        ),
      ),
    )
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ChatModelSection />)
    await screen.findByLabelText('Model')
    // Manually set temperature to trigger draft
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '1.0')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})
