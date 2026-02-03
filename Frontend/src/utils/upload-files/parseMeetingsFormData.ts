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

    if (!audioFile || audioFile.size === 0) {
      errors.push(`Meeting ${meetingIndex + 1}: Audio file is required`)
    }

    const metadata: MeetingMetadata = { title, date }

    if (language) metadata.language = language

    if (speakersStr) {
      const n = parseInt(speakersStr, 10)
      if (!Number.isNaN(n)) metadata.number_of_speakers = n
    }

    meetingsMetadata.push(metadata)
    if (audioFile) audioFiles.push(audioFile)

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
