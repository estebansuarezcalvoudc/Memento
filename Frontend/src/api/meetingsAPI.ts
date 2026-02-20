import { type Meeting, type MeetingContentResponse } from '../types/meetings'
import fetchBackend from './fetchBackend'

export type { Meeting, MeetingContentResponse }

export async function getAllMeetings(): Promise<Meeting[]> {
  return fetchBackend('GET', 'meetings')
}

export async function getMeetingSummary(
  id: string,
): Promise<MeetingContentResponse> {
  const data = await fetchBackend('GET', `meetings/summary/${id}`)
  return { content: data['summary'], title: data.title, date: data.date }
}

export async function getMeetingTranscription(
  id: string,
): Promise<MeetingContentResponse> {
  const data = await fetchBackend('GET', `meetings/transcription/${id}`)
  return { content: data['transcription'], title: data.title, date: data.date }
}

export async function updateMeeting(
  id: string,
  updates: Partial<Omit<Meeting, 'id'>>,
): Promise<null> {
  return fetchBackend('PATCH', `meetings/${id}`, updates)
}

export async function deleteMeeting(id: string): Promise<null> {
  return fetchBackend('DELETE', `meetings/${id}`)
}

export async function uploadMeetings(formData: FormData): Promise<Meeting[]> {
  return fetchBackend('POST', 'meetings', formData)
}
