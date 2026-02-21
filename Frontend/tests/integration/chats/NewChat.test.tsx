import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import NewChat from '../../../src/pages/chat/NewChat'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('NewChat Page', () => {
  it('send button is disabled when the input is empty', () => {
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/new-chat" element={<NewChat />} />
      </Routes>,
      { route: '/new-chat' },
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('send button is enabled when the input has text', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/new-chat" element={<NewChat />} />
      </Routes>,
      { route: '/new-chat' },
    )

    await user.type(screen.getByPlaceholderText('Some message...'), 'Hello')
    expect(screen.getByRole('button')).toBeEnabled()
  })

  it('creates a chat and navigates to it', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route path="/new-chat" element={<NewChat />} />
        <Route
          path="/chats/:chatId"
          element={<div>Chat Page new-chat-1</div>}
        />
      </Routes>,
      { route: '/new-chat' },
    )

    await user.type(screen.getByPlaceholderText('Some message...'), 'Hello')
    await user.click(screen.getByRole('button'))

    expect(await screen.findByText('Chat Page new-chat-1')).toBeInTheDocument()
  })
})
