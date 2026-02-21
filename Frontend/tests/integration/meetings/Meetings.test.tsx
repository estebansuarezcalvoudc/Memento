import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import Meetings from '../../../src/pages/meetings/Meetings'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('Meetings Page', () => {
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<Meetings />)

    expect(screen.getByText('Loading meetings')).toBeInTheDocument()
  })

  it('shows the list of meetings after loading', async () => {
    setAuthToken()
    renderWithRouter(<Meetings />)

    expect(await screen.findByText('Team Meeting')).toBeInTheDocument()
    expect(screen.getByText('Sprint Planning')).toBeInTheDocument()
  })

  it('shows empty state when there are no meetings', async () => {
    server.use(http.get('/api/meetings', () => HttpResponse.json([])))
    setAuthToken()
    renderWithRouter(<Meetings />)

    expect(
      await screen.findByText('You have not uploaded any meetings yet'),
    ).toBeInTheDocument()
  })

  it('shows error when the API fails', async () => {
    server.use(
      http.get('/api/meetings', () => new HttpResponse(null, { status: 500 })),
    )
    setAuthToken()
    renderWithRouter(<Meetings />)

    expect(await screen.findByText(/Error:/i)).toBeInTheDocument()
  })
})
