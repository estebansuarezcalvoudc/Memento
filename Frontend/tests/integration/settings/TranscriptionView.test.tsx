import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import TranscriptionView from '../../../src/components/settings/sections/transcription/TranscriptionView'
import { server } from '../../mocks/server'
import { withAuth } from '../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('TranscriptionView', () => {
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders WhisperX and AssemblyAI sections after initial load', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)

    expect(await screen.findByText('WhisperX')).toBeInTheDocument()
    expect(screen.getByText('AssemblyAI')).toBeInTheDocument()
    expect(screen.getByLabelText('Model size')).toHaveValue('base')
  })

  it('keeps AssemblyAI selector disabled when API key is missing', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)

    const aaiRadio = await screen.findByRole('radio', { name: 'AssemblyAI' })
    expect(aaiRadio).toBeDisabled()
  })

  it('enables AssemblyAI selector after adding API key', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<TranscriptionView />)

    await user.click(await screen.findByRole('button', { name: 'Add API key' }))
    await user.type(
      screen.getByPlaceholderText('Enter your API key'),
      'aai-valid',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'AssemblyAI' })).toBeEnabled(),
    )
  })

  it('shows invalid API key error when adding a bad AssemblyAI key', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<TranscriptionView />)

    await user.click(await screen.findByRole('button', { name: 'Add API key' }))
    await user.type(
      screen.getByPlaceholderText('Enter your API key'),
      'bad-key',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Invalid API key')).toBeInTheDocument()
  })

  it('changes active provider and sends PATCH /active-provider', async () => {
    const user = userEvent.setup()
    let patchPayload: unknown

    server.use(
      http.patch(
        '/api/settings/transcription/active-provider',
        withAuth(async ({ request }) => {
          patchPayload = await request.json()
          return new HttpResponse(null, { status: 204 })
        }),
      ),
    )

    setAuthToken()
    renderWithRouter(<TranscriptionView />)

    await user.click(await screen.findByRole('button', { name: 'Add API key' }))
    await user.type(
      screen.getByPlaceholderText('Enter your API key'),
      'aai-valid',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    const aaiRadio = screen.getByRole('radio', { name: 'AssemblyAI' })
    await waitFor(() => expect(aaiRadio).toBeEnabled())
    await user.click(aaiRadio)

    await waitFor(() => expect(patchPayload).toEqual({ provider: 'aai' }))
  })

  it('applies provider switch optimistically and does not show initial loader again', async () => {
    const user = userEvent.setup()

    server.use(
      http.patch(
        '/api/settings/transcription/active-provider',
        withAuth(async () => {
          await new Promise(resolve => setTimeout(resolve, 150))
          return new HttpResponse(null, { status: 204 })
        }),
      ),
    )

    setAuthToken()
    renderWithRouter(<TranscriptionView />)

    await user.click(await screen.findByRole('button', { name: 'Add API key' }))
    await user.type(
      screen.getByPlaceholderText('Enter your API key'),
      'aai-valid',
    )
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    const aaiRadio = screen.getByRole('radio', { name: 'AssemblyAI' })
    await waitFor(() => expect(aaiRadio).toBeEnabled())
    await user.click(aaiRadio)

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    expect(screen.getByText('WhisperX')).toBeInTheDocument()
    expect(screen.getByText('AssemblyAI')).toBeInTheDocument()
    await waitFor(() => expect(aaiRadio).toBeChecked())
  })

  it('changing model size calls the configuration PATCH endpoint', async () => {
    const user = userEvent.setup()
    let patchedBody: unknown

    server.use(
      http.patch(
        '/api/settings/transcription/configuration',
        withAuth(async ({ request }) => {
          patchedBody = await request.json()
          return HttpResponse.json({
            model_size: 'small',
            compute_type: 'float16',
            device: 'cuda',
          })
        }),
      ),
    )

    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model size')).toHaveValue('base'),
    )
    await user.selectOptions(screen.getByLabelText('Model size'), 'small')
    await waitFor(() => expect(patchedBody).toEqual({ model_size: 'small' }))
  })
})
