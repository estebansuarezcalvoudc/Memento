import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ChatInput from '../../../src/components/chat/ChatInput'
import Chat from '../../../src/pages/chat/Chat'
import { server } from '../../mocks/server'
import { withAuth } from '../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('ChatInput', () => {
  it('does not send when the message is empty', async () => {
    const user = userEvent.setup()
    let sendCalled = false
    server.use(
      http.post(
        '/api/conversations/:id/chat',
        withAuth(() => {
          sendCalled = true
          return HttpResponse.json('reply')
        }),
      ),
    )
    setAuthToken()
    renderWithRouter(<ChatInput chatId="chat-1" />)

    await user.click(screen.getByRole('button'))

    expect(sendCalled).toBe(false)
  })

  it('restores the message in the input when sending fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(
        '/api/conversations/:id/chat',
        withAuth(() => new HttpResponse(null, { status: 500 })),
      ),
    )
    setAuthToken()
    renderWithRouter(<ChatInput chatId="chat-1" />)

    const input = screen.getByPlaceholderText('Some message...')
    await user.type(input, 'Hello world')
    await user.click(screen.getByRole('button'))

    expect(await screen.findByDisplayValue('Hello world')).toBeInTheDocument()
  })
})

describe('Chat Page', () => {
  it('loads and displays the message history', async () => {
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/chats/:chatId" element={<Chat />} />
      </Routes>,
      { route: '/chats/chat-1' },
    )

    // Mock returns [{role:'user', content:'Hello'}, {role:'assistant', content:'Hi there'}]
    expect(await screen.findByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there')).toBeInTheDocument()
  })

  it('sending a message shows the user message immediately', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/chats/:chatId" element={<Chat />} />
      </Routes>,
      { route: '/chats/chat-1' },
    )

    // Wait for history to load first
    await screen.findByText('Hello')

    const input = screen.getByPlaceholderText('Some message...')
    await user.type(input, 'My new message')
    await user.click(screen.getByRole('button'))

    expect(screen.getByText('My new message')).toBeInTheDocument()
  })

  it('sending a message shows the assistant response', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/chats/:chatId" element={<Chat />} />
      </Routes>,
      { route: '/chats/chat-1' },
    )

    await screen.findByText('Hello')

    const input = screen.getByPlaceholderText('Some message...')
    await user.type(input, 'My new message')
    await user.click(screen.getByRole('button'))

    // Mock handler returns 'Assistant response here'
    expect(
      await screen.findByText('Assistant response here'),
    ).toBeInTheDocument()
  })
})
