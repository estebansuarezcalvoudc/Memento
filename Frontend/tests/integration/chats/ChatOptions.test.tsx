import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ChatItem from '../../../src/components/layout/sidebar/chats-list/ChatItem'
import ChatsList from '../../../src/components/layout/sidebar/chats-list/ChatsList'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

// ChatItem shows the options dropdown only when the inner div is hovered.
// We use fireEvent.mouseEnter on the specific div that holds the handler.
async function hoverAndOpenMenu(
  user: ReturnType<typeof userEvent.setup>,
  displayValue: string,
) {
  const input = screen.getByDisplayValue(displayValue)
  const chatItem = input.closest('li')
  if (!chatItem) {
    throw new Error('Chat item container not found')
  }

  const hoverDiv = chatItem.querySelector('div')
  if (!hoverDiv) {
    throw new Error('Hover container not found')
  }

  fireEvent.mouseEnter(hoverDiv)
  const menuButton = await within(chatItem).findByRole('button')
  await user.click(menuButton)
}

describe('Chat Options', () => {
  it('delete chat calls the API and removes the chat from the list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    // Render ChatsList so it reads from the store: deletion will remove the item
    renderWithRouter(<ChatsList />)

    expect(await screen.findByDisplayValue('First Chat')).toBeInTheDocument()

    await hoverAndOpenMenu(user, 'First Chat')

    const deleteButton = await screen.findByText('Delete')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByDisplayValue('First Chat')).not.toBeInTheDocument()
    })
    // The other chat should still be there
    expect(screen.getByDisplayValue('Second Chat')).toBeInTheDocument()
  })

  it('rename chat enables the input and saves on blur', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route
          path="/chats/:chatId"
          element={<ChatItem chatId="chat-1" chatTitle="First Chat" />}
        />
      </Routes>,
      { route: '/chats/chat-1' },
    )

    await hoverAndOpenMenu(user, 'First Chat')

    const renameButton = await screen.findByText('Rename')
    await user.click(renameButton)

    const input = screen.getByDisplayValue('First Chat')
    expect(input).not.toBeDisabled()

    await user.clear(input)
    await user.type(input, 'Renamed Chat')
    await user.tab() // triggers blur → saves

    expect(screen.getByDisplayValue('Renamed Chat')).toBeInTheDocument()
  })

  it('rename chat saves when pressing Enter key', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route
          path="/chats/:chatId"
          element={<ChatItem chatId="chat-1" chatTitle="First Chat" />}
        />
      </Routes>,
      { route: '/chats/chat-1' },
    )

    await hoverAndOpenMenu(user, 'First Chat')

    const renameButton = await screen.findByText('Rename')
    await user.click(renameButton)

    const input = screen.getByDisplayValue('First Chat')
    await user.clear(input)
    await user.type(input, 'Renamed via Enter{Enter}')

    expect(screen.getByDisplayValue('Renamed via Enter')).toBeInTheDocument()
  })
})
