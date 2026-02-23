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
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows the configured model in the select after loading', async () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model')).toHaveValue('gpt-4o'),
    )
  })

  it('shows available models as select options', async () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    expect(screen.getByRole('option', { name: /gpt-4o/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /llama3/ })).toBeInTheDocument()
  })

  it('shows the configured temperature value', async () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Temperature')).toHaveValue(0.7),
    )
  })

  it('shows the configured max tokens value', async () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await waitFor(() =>
      expect(screen.getByLabelText('Max tokens')).toHaveValue(2000),
    )
  })

  it('Save and Cancel are disabled while no edits have been made', async () => {
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('changing the model enables Save and Cancel', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled()
  })

  it('changing temperature enables Save', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Temperature')
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '1.2')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
  })

  it('Cancel resets the model to the original value', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('Model')).toHaveValue('gpt-4o')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Save calls the PUT endpoint with the updated model config', async () => {
    const user = userEvent.setup()
    let capturedBody: unknown
    server.use(
      http.put('/api/settings/models/summary', withAuth(async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(await request.clone().json())
      })),
    )
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(capturedBody).toMatchObject({ model_name: 'llama3', provider: 'ollama' }),
    )
  })

  it('Save disables Save and Cancel on success', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    )
  })

  it('shows an error message when Save fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.put('/api/settings/models/summary', withAuth(() =>
        new HttpResponse(null, { status: 500 }),
      )),
    )
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    await user.selectOptions(screen.getByLabelText('Model'), 'llama3')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Failed to save. Please try again.')).toBeInTheDocument()
  })

  it('Save is disabled when no model is selected', async () => {
    server.use(
      http.get('/api/settings/models/summary', withAuth(() =>
        HttpResponse.json({ provider: '', model_name: '', temperature: 0.7, max_tokens: 2000 }),
      )),
    )
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<ModelSection />)
    await screen.findByLabelText('Model')
    // Manually set temperature to trigger draft
    await user.clear(screen.getByLabelText('Temperature'))
    await user.type(screen.getByLabelText('Temperature'), '1.0')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})
