import { act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'

import * as parseFormDataModule from '../../../src/components/meetings/upload/parseMeetingsFormData'

export function createAudioFile(name = 'recording.mp3') {
  return new File(['audio content'], name, { type: 'audio/mpeg' })
}

// Submit the form by dispatching a native submit event on the first form in the
// document. Searches the whole document to handle forms rendered inside portals.
export function submitForm() {
  act(() => {
    const form = document.querySelector('form')
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
  })
}

// Spy on parseMeetingsFromFormData to return a valid result for `count` meetings.
// jsdom's FormData constructor does not reliably read File inputs, so we mock
// parsing for API-response tests and test file validation with the real impl.
export function spyValidParsing(count = 1) {
  const meetingsMetadata = Array.from({ length: count }, (_, i) => ({
    title: `Meeting ${i + 1}`,
    date: '2024-03-01',
  }))
  const audioFiles = Array.from({ length: count }, (_, i) =>
    createAudioFile(`recording${i + 1}.mp3`),
  )
  return vi
    .spyOn(parseFormDataModule, 'parseMeetingsFromFormData')
    .mockReturnValue({ ok: true, meetingsMetadata, audioFiles })
}

// MSW handler that responds with `count` new meetings after an optional delay.
export function meetingsPostHandler(count = 1, delayMs = 0) {
  return http.post('/api/meetings', async () => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
    const meetings = Array.from({ length: count }, (_, i) => ({
      id: `new-meeting-${i + 1}`,
      title: `New Meeting ${i + 1}`,
      date: '2024-03-01',
    }))
    return HttpResponse.json(meetings)
  })
}
