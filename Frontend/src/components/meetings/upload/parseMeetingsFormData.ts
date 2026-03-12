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

type TFunction = (key: string, options?: Record<string, unknown>) => string

const SUPPORTED_AUDIO_FORMATS = new Set([
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'm4a',
  'wav',
  'webm',
])

export function parseMeetingsFromFormData(
  formData: FormData,
  t: TFunction,
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
      errors.push(
        t('meetings.uploadDialog.validationErrors.titleRequired', {
          number: meetingIndex + 1,
        }),
      )
    }

    if (!date) {
      errors.push(
        t('meetings.uploadDialog.validationErrors.dateRequired', {
          number: meetingIndex + 1,
        }),
      )
    }

    const audioError = validateAudioFile(audioFile, meetingIndex, t)
    if (audioError) {
      errors.push(audioError)
    }

    const metadata: MeetingMetadata = { title, date }

    if (language) {
      metadata.language = language
    }

    if (speakersStr) {
      const n = parseInt(speakersStr, 10)
      if (!Number.isNaN(n) && n >= 2) {
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
    errors.push(t('meetings.uploadDialog.validationErrors.atLeastOne'))
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, meetingsMetadata, audioFiles }
}

function validateAudioFile(
  file: File | null,
  meetingIndex: number,
  t: TFunction,
): string | null {
  if (!file || file.size === 0) {
    return t('meetings.uploadDialog.validationErrors.audioRequired', {
      number: meetingIndex + 1,
    })
  }

  if (!file.name) {
    return t('meetings.uploadDialog.validationErrors.audioNoFilename', {
      number: meetingIndex + 1,
    })
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !SUPPORTED_AUDIO_FORMATS.has(fileExtension)) {
    return t('meetings.uploadDialog.validationErrors.audioUnsupportedFormat', {
      number: meetingIndex + 1,
      ext: fileExtension,
      formats: Array.from(SUPPORTED_AUDIO_FORMATS).sort().join(', '),
    })
  }

  if (!file.type || !file.type.startsWith('audio/')) {
    return t('meetings.uploadDialog.validationErrors.audioNotAudioFile', {
      number: meetingIndex + 1,
    })
  }

  return null
}
