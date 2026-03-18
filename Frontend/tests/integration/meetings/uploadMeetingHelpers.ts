import { act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'

import * as parseFormDataModule from '../../../src/components/meetings/upload/utils/parseMeetingsFormData'

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

    const blocks = [
      `data: ${JSON.stringify({ type: 'JobStarted', total_meetings: count })}`,
      ...Array.from({ length: count }, (_, i) => {
        const index = i
        const title = `Meeting ${i + 1}`
        return [
          `data: ${JSON.stringify({ type: 'MeetingProcessingStarted', index, title })}`,
          `data: ${JSON.stringify({
            type: 'MeetingProcessingSucceeded',
            index,
            title,
            meeting_id: `new-meeting-${i + 1}`,
          })}`,
        ]
      }).flat(),
      `data: ${JSON.stringify({
        type: 'JobFinished',
        meetings_succeeded: count,
        meetings_failed: 0,
      })}`,
    ]

    return new HttpResponse(`${blocks.join('\n\n')}\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  })
}

export function meetingsPartialFailurePostHandler(
  count = 4,
  failedIndexes: number[] = [1, 3],
  delayMs = 0,
) {
  return http.post('/api/meetings', async () => {
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    const failedSet = new Set(failedIndexes)
    const succeeded = count - failedSet.size

    const blocks = [
      `data: ${JSON.stringify({ type: 'JobStarted', total_meetings: count })}`,
      ...Array.from({ length: count }, (_, i) => {
        const index = i
        const title = `Meeting ${i + 1}`

        const started = `data: ${JSON.stringify({ type: 'MeetingProcessingStarted', index, title })}`

        if (failedSet.has(index)) {
          const failed = `data: ${JSON.stringify({ type: 'MeetingProcessingFailed', index, title, error: 'forced failure' })}`
          return [started, failed]
        }

        const success = `data: ${JSON.stringify({ type: 'MeetingProcessingSucceeded', index, title, meeting_id: `new-meeting-${i + 1}` })}`
        return [started, success]
      }).flat(),
      `data: ${JSON.stringify({
        type: 'JobFinished',
        meetings_succeeded: succeeded,
        meetings_failed: failedSet.size,
      })}`,
    ]

    return new HttpResponse(`${blocks.join('\n\n')}\n\n`, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  })
}
