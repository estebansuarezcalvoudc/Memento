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

  it('renders the model size select with the configured value', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await waitFor(() =>
      expect(screen.getByLabelText('Model size')).toHaveValue('base'),
    )
  })

  it('renders the compute type select with the configured value', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await waitFor(() =>
      expect(screen.getByLabelText('Compute type')).toHaveValue('float16'),
    )
  })

  it('renders the device select with the configured value', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await waitFor(() =>
      expect(screen.getByLabelText('Device')).toHaveValue('cuda'),
    )
  })

  it('shows available model size options', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await screen.findByLabelText('Model size')
    expect(screen.getByRole('option', { name: 'tiny' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'large-v3' })).toBeInTheDocument()
  })

  it('shows the CUDA fallback warning when device is cuda', async () => {
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await screen.findByLabelText('Device')
    expect(
      screen.getByText(/transcription will automatically fall back to CPU/i),
    ).toBeInTheDocument()
  })

  it('does not show the CUDA warning when device is cpu', async () => {
    server.use(
      http.get(
        '/api/settings/transcription/configuration',
        withAuth(() =>
          HttpResponse.json({
            model_size: 'base',
            compute_type: 'float16',
            device: 'cpu',
          }),
        ),
      ),
    )
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await screen.findByLabelText('Device')
    expect(
      screen.queryByText(/transcription will automatically fall back to CPU/i),
    ).not.toBeInTheDocument()
  })

  it('changing model size calls the PATCH endpoint', async () => {
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
    await screen.findByLabelText('Model size')
    await user.selectOptions(screen.getByLabelText('Model size'), 'small')
    await waitFor(() => expect(patchedBody).toEqual({ model_size: 'small' }))
  })

  it('changing compute type calls the PATCH endpoint', async () => {
    const user = userEvent.setup()
    let patchedBody: unknown
    server.use(
      http.patch(
        '/api/settings/transcription/configuration',
        withAuth(async ({ request }) => {
          patchedBody = await request.json()
          return HttpResponse.json({
            model_size: 'base',
            compute_type: 'int8',
            device: 'cuda',
          })
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await screen.findByLabelText('Compute type')
    await user.selectOptions(screen.getByLabelText('Compute type'), 'int8')
    await waitFor(() => expect(patchedBody).toEqual({ compute_type: 'int8' }))
  })

  it('changing device calls the PATCH endpoint', async () => {
    const user = userEvent.setup()
    let patchedBody: unknown
    server.use(
      http.patch(
        '/api/settings/transcription/configuration',
        withAuth(async ({ request }) => {
          patchedBody = await request.json()
          return HttpResponse.json({
            model_size: 'base',
            compute_type: 'float16',
            device: 'cpu',
          })
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<TranscriptionView />)
    await screen.findByLabelText('Device')
    await user.selectOptions(screen.getByLabelText('Device'), 'cpu')
    await waitFor(() =>
      expect(patchedBody).toEqual({ device: 'cpu', compute_type: 'int8' }),
    )
  })
})
