import '@testing-library/jest-dom'
import '../src/i18n'

import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from './mocks/server'
import { resetTranscriptionMockState } from './mocks/settings/transcriptionHandlers'

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

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  resetTranscriptionMockState()
  localStorage.clear()
})
afterAll(() => server.close())
