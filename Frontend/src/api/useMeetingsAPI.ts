import { useCallback } from 'react'

import type { Meeting } from './useMeetingsQuery'
import fetchBackend from './fetchBackend'

export interface MeetingMetadataResponse {
  id: string
  title: string
  date: string
  language?: string | null
}

export interface MeetingContentResponse {
  content: string
  title: string
  date: string
}

export default function useMeetingsAPI() {
  const uploadMeetings = useCallback(
    async (formData: FormData): Promise<MeetingMetadataResponse[]> =>
      fetchBackend('POST', 'meetings', formData),
    [],
  )

  const getAllMeetings = useCallback(
    async (): Promise<MeetingMetadataResponse[]> =>
      fetchBackend('GET', 'meetings'),
    [],
  )

  const getMeetingSummary = useCallback(
    async (id: string): Promise<MeetingContentResponse> => {
      const data = await fetchBackend('GET', `meetings/summary/${id}`)
      return {
        content: data['summary'],
        title: data.title,
        date: data.date,
      }
    },
    [],
  )

  const getMeetingTranscription = useCallback(
    async (id: string): Promise<MeetingContentResponse> => {
      const data = await fetchBackend('GET', `meetings/transcription/${id}`)
      return {
        content: data['transcription'],
        title: data.title,
        date: data.date,
      }
    },
    [],
  )

  const updateMeeting = useCallback(
    async (id: string, updates: Partial<Meeting>): Promise<null> =>
      fetchBackend('PATCH', `meetings/${id}`, updates),
    [],
  )

  const deleteMeeting = useCallback(
    async (id: string): Promise<null> => fetchBackend('DELETE', `meetings/${id}`),
    [],
  )

  return {
    uploadMeetings,
    getAllMeetings,
    getMeetingSummary,
    getMeetingTranscription,
    updateMeeting,
    deleteMeeting,
  }
}
