import '@testing-library/jest-dom'

import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from './mocks/server'

// jsdom does not implement ResizeObserver (used by @headlessui/react)
/* eslint-disable @typescript-eslint/no-empty-function */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

// jsdom does not implement HTMLDialogElement.showModal / close
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}

// jsdom does not implement window.matchMedia (used by themeStore)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
