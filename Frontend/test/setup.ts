import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from './mocks/server'

// jsdom does not implement ResizeObserver (used by @headlessui/react)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does not implement HTMLDialogElement.showModal / close
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open')
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())
