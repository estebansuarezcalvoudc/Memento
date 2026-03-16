import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, vi } from 'vitest'

import { _resetAuthStore } from '../src/stores/authStore'
import { _resetMeetingListStore } from '../src/stores/meetingListStore'

export { _resetAuthStore }

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
  ensurePortal('dialog')
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
    _resetAuthStore()
    _resetMeetingListStore()
  })
  afterEach(() => {
    cleanup()
  })
}
