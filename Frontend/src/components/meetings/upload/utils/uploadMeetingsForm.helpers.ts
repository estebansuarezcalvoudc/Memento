import { type UploadMeetingsState } from '../../../../api/meetings/useUploadMeetings'
import { type MeetingFormData } from '../types'
import { type MeetingMetadata } from './parseMeetingsFormData'

export async function processUploadMeetings(
  meetingsMetadata: MeetingMetadata[],
  audioFiles: File[],
  startUpload: (
    formData: FormData,
    meetingsCount: number,
  ) => Promise<UploadMeetingsState>,
): Promise<UploadMeetingsState> {
  try {
    const backendFormData = new FormData()
    backendFormData.append(
      'meetings_data',
      JSON.stringify({ meetings_metadata: meetingsMetadata }),
    )

    audioFiles.forEach(file => backendFormData.append('audios', file))

    return await startUpload(backendFormData, meetingsMetadata.length)
  } catch (error) {
    return {
      phase: 'failed',
      total: meetingsMetadata.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentTitle: null,
      errors: [],
      meetingStatuses: [],
      lastEvent: null,
      errorMessage:
        error instanceof Error ? error.message : String(error),
    }
  }
}

export function getFailedMeetingsForRetry(
  meetings: MeetingFormData[],
  errors: UploadMeetingsState['errors'],
): MeetingFormData[] {
  const failedIndexes = new Set(errors.map(error => error.index))

  return meetings
    .filter((_, index) => failedIndexes.has(index))
    .map(meeting => ({
      ...meeting,
      fromPreviousFailure: true,
    }))
}

export function getMeetingsFromFormData(
  meetings: MeetingFormData[],
  formData: FormData,
): MeetingFormData[] {
  return meetings.map((meeting, index) => {
    const language = formData.get(`meetings[${index}][language]`) as string

    return {
      ...meeting,
      title:
        (formData.get(`meetings[${index}][title]`) as string) || meeting.title,
      date:
        (formData.get(`meetings[${index}][date]`) as string) || meeting.date,
      language: language || meeting.language,
      speakers:
        (formData.get(`meetings[${index}][speakers]`) as string) ||
        meeting.speakers,
      fromPreviousFailure: meeting.fromPreviousFailure,
    }
  })
}
