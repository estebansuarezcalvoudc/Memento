import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { _resetAuthStore } from '../src/stores/authStore'
import { _resetChatsStore } from '../src/stores/chatsStore'
import { _resetMeetingsStore } from '../src/stores/meetingsStore'

export { _resetAuthStore, _resetChatsStore, _resetMeetingsStore }

function ensurePortal(id: string) {
  if (!document.getElementById(id)) {
    const div = document.createElement('div')
    div.id = id
    document.body.appendChild(div)
  }
}

export function renderWithRouter(
  ui: React.ReactElement,
  { route = '/' }: { route?: string } = {},
) {
  ensurePortal('upload-meetings-modal')
  ensurePortal('notification')

  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}

export function setAuthToken(token = 'fake-token') {
  localStorage.setItem('access_token', token)
}

export function setupStoreReset() {
  beforeEach(() => {
    vi.restoreAllMocks()
    _resetChatsStore()
    _resetMeetingsStore()
    _resetAuthStore()
  })
  afterEach(() => {
    cleanup()
  })
}
