import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import Chat from '../../../src/pages/chat/Chat'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

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
