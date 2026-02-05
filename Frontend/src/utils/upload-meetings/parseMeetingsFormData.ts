export interface MeetingMetadata {
  title: string
  date: string
  language?: string
  number_of_speakers?: number
}

interface ParseOk {
  ok: true
  meetingsMetadata: MeetingMetadata[]
  audioFiles: File[]
}

interface ParseErr {
  ok: false
  errors: string[]
}

export type ParseMeetingsResult = ParseOk | ParseErr

const SUPPORTED_AUDIO_FORMATS = new Set([
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'm4a',
  'wav',
  'webm',
])

function validateAudioFile(
  file: File | null,
  meetingIndex: number,
): string | null {
  if (!file || file.size === 0) {
    return `Meeting ${meetingIndex + 1}: Audio file is required`
  }

  if (!file.name) {
    return `Meeting ${meetingIndex + 1}: Audio file must have a filename`
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !SUPPORTED_AUDIO_FORMATS.has(fileExtension)) {
    return `Meeting ${meetingIndex + 1}: Unsupported audio format "${fileExtension}". Supported formats: ${Array.from(SUPPORTED_AUDIO_FORMATS).sort().join(', ')}`
  }

  if (!file.type || !file.type.startsWith('audio/')) {
    return `Meeting ${meetingIndex + 1}: File must be an audio file`
  }

  return null
}

export function parseMeetingsFromFormData(
  formData: FormData,
): ParseMeetingsResult {
  const audioFiles: File[] = []
  const meetingsMetadata: MeetingMetadata[] = []
  const errors: string[] = []

  let meetingIndex = 0

  while (formData.has(`meetings[${meetingIndex}][title]`)) {
    const titleRaw = formData.get(`meetings[${meetingIndex}][title]`)
    const dateRaw = formData.get(`meetings[${meetingIndex}][date]`)
    const languageRaw = formData.get(`meetings[${meetingIndex}][language]`)
    const speakersRaw = formData.get(`meetings[${meetingIndex}][speakers]`)
    const audioFileRaw = formData.get(`meetings[${meetingIndex}][file]`)

    const title = typeof titleRaw === 'string' ? titleRaw.trim() : ''
    const date = typeof dateRaw === 'string' ? dateRaw : ''
    const language = typeof languageRaw === 'string' ? languageRaw.trim() : ''
    const speakersStr =
      typeof speakersRaw === 'string' ? speakersRaw.trim() : ''

    const audioFile = audioFileRaw instanceof File ? audioFileRaw : null

    if (!title) {
      errors.push(`Meeting ${meetingIndex + 1}: Title is required`)
    }

    if (!date) {
      errors.push(`Meeting ${meetingIndex + 1}: Date is required`)
    }

    const audioError = validateAudioFile(audioFile, meetingIndex)
    if (audioError) {
      errors.push(audioError)
    }

    const metadata: MeetingMetadata = { title, date }

    if (language) {
      metadata.language = language
    }

    if (speakersStr) {
      const n = parseInt(speakersStr, 10)
      if (!Number.isNaN(n)) {
        metadata.number_of_speakers = n
      }
    }

    meetingsMetadata.push(metadata)

    if (audioFile) {
      audioFiles.push(audioFile)
    }

    meetingIndex++
  }

  if (meetingsMetadata.length === 0) {
    errors.push('You must add at least one meeting')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, meetingsMetadata, audioFiles }
}
