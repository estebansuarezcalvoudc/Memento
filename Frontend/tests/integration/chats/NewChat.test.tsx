import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import Chat from '../../../src/pages/chat/Chat'
import { createWsMock } from '../../mocks/createWsMock'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('New Chat', () => {
  it('send button is disabled when the input is empty', () => {
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/chats" element={<Chat />} />
      </Routes>,
      { route: '/chats' },
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('send button is enabled when the input has text', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/chats" element={<Chat />} />
      </Routes>,
      { route: '/chats' },
    )

    await user.type(screen.getByPlaceholderText('Some message...'), 'Hello')
    expect(screen.getByRole('button')).toBeEnabled()
  })

  it('creates a chat and navigates to it', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('WebSocket', createWsMock())
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/chats" element={<Chat />} />
        <Route
          path="/chats/:chatId"
          element={<div>Chat Page new-chat-1</div>}
        />
      </Routes>,
      { route: '/chats' },
    )

    await user.type(screen.getByPlaceholderText('Some message...'), 'Hello')
    await user.click(screen.getByRole('button'))

    expect(await screen.findByText('Chat Page new-chat-1')).toBeInTheDocument()
  })
})
