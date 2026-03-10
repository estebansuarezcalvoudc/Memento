import { describe, expect, it } from 'vitest'

import { parseMeetingsFromFormData } from '../../../src/components/meetings/upload/parseMeetingsFormData'

// Helper to build a minimal valid FormData for one meeting
function buildValidFormData(overrides: Record<string, string | File> = {}) {
  const fd = new FormData()
  fd.append('meetings[0][title]', 'Team Meeting')
  fd.append('meetings[0][date]', '2024-01-15')
  fd.append(
    'meetings[0][file]',
    new File(['audio'], 'recording.mp3', { type: 'audio/mpeg' }),
  )
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value)
  }
  return fd
}

describe('parseMeetingsFromFormData – valid input', () => {
  it('returns ok=true with correct metadata for a minimal valid meeting', () => {
    const result = parseMeetingsFromFormData(buildValidFormData())
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.meetingsMetadata).toHaveLength(1)
    expect(result.meetingsMetadata[0]).toMatchObject({
      title: 'Team Meeting',
      date: '2024-01-15',
    })
    expect(result.audioFiles).toHaveLength(1)
  })

  it('includes language in metadata when provided', () => {
    const fd = buildValidFormData({ 'meetings[0][language]': 'en' })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.meetingsMetadata[0].language).toBe('en')
  })

  it('includes number_of_speakers in metadata when a valid integer >= 2 is given', () => {
    const fd = buildValidFormData({ 'meetings[0][speakers]': '3' })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.meetingsMetadata[0].number_of_speakers).toBe(3)
  })

  it('omits number_of_speakers when speakers value is less than 2', () => {
    const fd = buildValidFormData({ 'meetings[0][speakers]': '1' })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.meetingsMetadata[0].number_of_speakers).toBeUndefined()
  })

  it('omits number_of_speakers when speakers value is not a number', () => {
    const fd = buildValidFormData({ 'meetings[0][speakers]': 'abc' })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.meetingsMetadata[0].number_of_speakers).toBeUndefined()
  })
})

describe('parseMeetingsFromFormData – empty FormData', () => {
  it('returns ok=false with "at least one meeting" error when FormData is empty', () => {
    const result = parseMeetingsFromFormData(new FormData())
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors).toContain('You must add at least one meeting')
  })
})

describe('parseMeetingsFromFormData – missing fields', () => {
  it('returns error when title is missing', () => {
    const fd = buildValidFormData({ 'meetings[0][title]': '' })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/Title is required/)
  })

  it('returns error when date is missing', () => {
    const fd = buildValidFormData({ 'meetings[0][date]': '' })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/Date is required/)
  })

  it('returns error when audio file is missing (size 0)', () => {
    const fd = buildValidFormData({
      'meetings[0][file]': new File([], 'empty.mp3', { type: 'audio/mpeg' }),
    })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/Audio file is required/)
  })
})

describe('parseMeetingsFromFormData – invalid audio file', () => {
  it('returns error when the file has no name', () => {
    // A File with an empty name string
    const file = new File(['audio'], '', { type: 'audio/mpeg' })
    const fd = buildValidFormData({ 'meetings[0][file]': file })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/must have a filename/)
  })

  it('returns error for an unsupported file extension', () => {
    const file = new File(['data'], 'notes.txt', { type: 'audio/mpeg' })
    const fd = buildValidFormData({ 'meetings[0][file]': file })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/Unsupported audio format/)
  })

  it('returns error when MIME type is not audio/', () => {
    const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' })
    const fd = buildValidFormData({ 'meetings[0][file]': file })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/must be an audio file/)
  })

  it('returns error when MIME type is empty', () => {
    const file = new File(['data'], 'recording.mp3', { type: '' })
    const fd = buildValidFormData({ 'meetings[0][file]': file })
    const result = parseMeetingsFromFormData(fd)
    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.errors[0]).toMatch(/must be an audio file/)
  })
})
