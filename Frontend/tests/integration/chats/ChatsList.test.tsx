import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import ChatsList from '../../../src/components/layout/sidebar/chats-list/ChatsList'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('ChatsList Component', () => {
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<ChatsList />)

    expect(screen.getByText('Loading conversations...')).toBeInTheDocument()
  })

  it('shows chats after loading', async () => {
    setAuthToken()
    renderWithRouter(<ChatsList />)

    // Chat titles are rendered inside <input value="..."> elements
    expect(await screen.findByDisplayValue('First Chat')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Second Chat')).toBeInTheDocument()
  })

  it('shows empty state when there are no conversations', async () => {
    server.use(http.get('/api/conversations', () => HttpResponse.json([])))
    setAuthToken()
    renderWithRouter(<ChatsList />)

    expect(await screen.findByText('No conversations yet')).toBeInTheDocument()
  })

  it('shows error when the API fails', async () => {
    server.use(
      http.get(
        '/api/conversations',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ChatsList />)

    expect(await screen.findByText(/Error:/i)).toBeInTheDocument()
  })
})
