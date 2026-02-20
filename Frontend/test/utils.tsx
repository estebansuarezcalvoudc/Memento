import { cleanup, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { _resetAuthStore } from '../src/stores/authStore'
import { _resetChatsStore } from '../src/stores/chatsStore'

export { _resetAuthStore, _resetChatsStore }

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

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

export function setAuthToken(token = 'fake-token') {
  localStorage.setItem('access_token', token)
}

export function setupStoreReset() {
  beforeEach(() => {
    vi.restoreAllMocks()
    _resetChatsStore()
    _resetAuthStore()
  })
  afterEach(() => {
    cleanup()
  })
}
