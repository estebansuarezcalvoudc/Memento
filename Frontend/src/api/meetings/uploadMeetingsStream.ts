import camelcaseKeys from 'camelcase-keys'

import { type MeetingUploadEvent } from './meetingEvents'

const SSE_BLOCK_DELIMITER = '\n\n'

interface UploadMeetingsStreamParams {
  formData: FormData
  signal?: AbortSignal
  onEvent: (event: MeetingUploadEvent) => void
}

export async function uploadMeetingsStream({
  formData,
  signal,
  onEvent,
}: UploadMeetingsStreamParams): Promise<void> {
  const response = await fetchUploadMeetingsResponse(formData, signal)

  await assertSuccessfulResponse(response)
  assertEventStreamResponse(response)
  const stream = getResponseStream(response)

  await consumeSseStream(stream, onEvent)
}

async function fetchUploadMeetingsResponse(
  formData: FormData,
  signal?: AbortSignal,
): Promise<Response> {
  const token = localStorage.getItem('access_token')

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch('/api/meetings', {
    method: 'POST',
    headers,
    body: formData,
    signal,
  })
}

async function assertSuccessfulResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)

    dispatchUnauthorizedIfBearer(response)

    throw new Error(body?.detail ?? `HTTP error! status: ${response.status}`)
  }
}

function assertEventStreamResponse(response: Response): void {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) {
    throw new Error('Invalid response content type for meetings upload stream')
  }
}

function getResponseStream(response: Response): ReadableStream<Uint8Array> {
  if (!response.body) {
    throw new Error('Missing response body for meetings upload stream')
  }

  return response.body
}

async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: MeetingUploadEvent) => void,
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      buffer += decoder.decode()
      buffer = normalizeLineEndings(buffer)
      break
    }

    buffer += decoder.decode(value, { stream: true })
    buffer = normalizeLineEndings(buffer)
    const parsed = splitSseBlocks(buffer)
    buffer = parsed.remaining

    for (const block of parsed.blocks) {
      const event = parseSseBlock(block)
      if (!event) {
        continue
      }

      onEvent(event)
    }
  }

  if (buffer.trim()) {
    const event = parseSseBlock(buffer)
    if (event) {
      onEvent(event)
    }
  }
}

function dispatchUnauthorizedIfBearer(response: Response): void {
  if (response.status !== 401) {
    return
  }

  const wwwAuthenticate =
    response.headers.get('WWW-Authenticate') ??
    response.headers.get('www-authenticate')
  if (wwwAuthenticate && /bearer/i.test(wwwAuthenticate)) {
    window.dispatchEvent(new CustomEvent('unauthorized'))
  }
}

function splitSseBlocks(value: string): {
  blocks: string[]
  remaining: string
} {
  const blocks: string[] = []
  let cursor = 0
  let delimiterIndex = value.indexOf(SSE_BLOCK_DELIMITER, cursor)

  while (delimiterIndex !== -1) {
    blocks.push(value.slice(cursor, delimiterIndex))
    cursor = delimiterIndex + SSE_BLOCK_DELIMITER.length
    delimiterIndex = value.indexOf(SSE_BLOCK_DELIMITER, cursor)
  }

  const remaining = value.slice(cursor)

  return {
    blocks,
    remaining,
  }
}

function parseSseBlock(block: string): MeetingUploadEvent | null {
  const lines = block.split('\n')
  let eventName = 'message'
  const dataLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (!line || line.startsWith(':')) {
      continue
    }

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trimStart()
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  const rawData = dataLines.join('\n')

  if (eventName === 'error') {
    const parsedError = JSON.parse(rawData) as {
      error?: string
      detail?: string
    }
    throw new Error(parsedError.error ?? parsedError.detail ?? 'Stream error')
  }

  const parsed = JSON.parse(rawData)
  return camelcaseKeys(parsed, { deep: true }) as MeetingUploadEvent
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}
