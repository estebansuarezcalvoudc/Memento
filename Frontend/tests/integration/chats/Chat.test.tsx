import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import ChatInput from '../../../src/components/chat/ChatInput'
import Chat from '../../../src/pages/chat/Chat'
import { createManualWsMock, createWsMock } from '../../mocks/createWsMock'
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

    expect(await screen.findByText('My new message')).toBeInTheDocument()
  })

  it('sending a message shows the assistant response', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('WebSocket', createWsMock())
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

    // WS mock echoes back the message as the token content
    expect(await screen.findByText('Echo: My new message')).toBeInTheDocument()
  })

  it('shows the retrieving spinner while context is being fetched', async () => {
    const user = userEvent.setup()
    const { WsMock, getLastInstance } = createManualWsMock()
    vi.stubGlobal('WebSocket', WsMock)
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

    const ws = getLastInstance()!
    ws.simulateEvent({ type: 'retrieving' })

    expect(
      await screen.findByText('Checking meeting information...'),
    ).toBeInTheDocument()
  })

  it('shows thinking spinner when model sends thinking events', async () => {
    const user = userEvent.setup()
    const { WsMock, getLastInstance } = createManualWsMock()
    vi.stubGlobal('WebSocket', WsMock)
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

    const ws = getLastInstance()!
    ws.simulateEvent({ type: 'thinking_start' })

    expect(await screen.findByText('Thinking...')).toBeInTheDocument()

    ws.simulateEvent({ type: 'thinking_end' })
    ws.simulateEvent({ type: 'token', content: 'Final answer' })

    expect(
      await screen.findByText('Final answer', { selector: 'p' }),
    ).toBeInTheDocument()
  })

  it('streams the assistant response progressively', async () => {
    const user = userEvent.setup()
    const { WsMock, getLastInstance } = createManualWsMock()
    vi.stubGlobal('WebSocket', WsMock)
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

    const ws = getLastInstance()!
    ws.simulateEvent({ type: 'retrieving' })
    ws.simulateEvent({ type: 'token', content: 'Hello' })
    expect(
      await screen.findByText('Hello', { selector: 'p' }),
    ).toBeInTheDocument()

    ws.simulateEvent({ type: 'token', content: ' world' })
    expect(
      await screen.findByText('Hello world', { selector: 'p' }),
    ).toBeInTheDocument()
  })

  it('disables the input while the assistant is responding and re-enables it when done', async () => {
    const user = userEvent.setup()
    const { WsMock, getLastInstance } = createManualWsMock()
    vi.stubGlobal('WebSocket', WsMock)
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

    const ws = getLastInstance()!
    ws.simulateEvent({ type: 'retrieving' })
    expect(input).toBeDisabled()

    ws.simulateEvent({ type: 'token', content: 'Partial response' })
    expect(input).toBeDisabled()

    ws.simulateEvent({ type: 'done' })
    expect(await screen.findByRole('textbox')).toBeEnabled()
  })
})
