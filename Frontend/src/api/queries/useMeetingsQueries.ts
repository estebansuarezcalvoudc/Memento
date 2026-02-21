import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Meeting, type MeetingContentResponse } from '../../types/meetings'
import fetchBackend from '../utils/fetchBackend'

async function getAllMeetings(): Promise<Meeting[]> {
  return fetchBackend('GET', 'meetings')
}

async function getMeetingSummary(id: string): Promise<MeetingContentResponse> {
  const data = await fetchBackend('GET', `meetings/summary/${id}`)
  return { content: data['summary'], title: data.title, date: data.date }
}

async function getMeetingTranscription(
  id: string,
): Promise<MeetingContentResponse> {
  const data = await fetchBackend('GET', `meetings/transcription/${id}`)
  return { content: data['transcription'], title: data.title, date: data.date }
}

async function updateMeeting(
  id: string,
  updates: Partial<Omit<Meeting, 'id'>>,
): Promise<null> {
  return fetchBackend('PATCH', `meetings/${id}`, updates)
}

async function deleteMeeting(id: string): Promise<null> {
  return fetchBackend('DELETE', `meetings/${id}`)
}

async function uploadMeetings(formData: FormData): Promise<Meeting[]> {
  return fetchBackend('POST', 'meetings', formData)
}

const MEETINGS_KEY = ['meetings'] as const

export function useGetMeetings() {
  return useQuery({
    queryKey: MEETINGS_KEY,
    queryFn: getAllMeetings,
  })
}

export function useGetMeetingSummary(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting', 'summary', id],
    queryFn: () => getMeetingSummary(id!),
    enabled: !!id,
  })
}

export function useGetMeetingTranscription(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting', 'transcription', id],
    queryFn: () => getMeetingTranscription(id!),
    enabled: !!id,
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMeeting,
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY })
      const previous = queryClient.getQueryData<Meeting[]>(MEETINGS_KEY)
      queryClient.setQueryData<Meeting[]>(
        MEETINGS_KEY,
        old => old?.filter(m => m.id !== id) ?? [],
      )
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(MEETINGS_KEY, context?.previous)
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY })
    },
  })
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Meeting> }) =>
      updateMeeting(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: MEETINGS_KEY })
      const previous = queryClient.getQueryData<Meeting[]>(MEETINGS_KEY)
      queryClient.setQueryData<Meeting[]>(
        MEETINGS_KEY,
        old => old?.map(m => (m.id === id ? { ...m, ...updates } : m)) ?? [],
      )
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(MEETINGS_KEY, context?.previous)
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY })
    },
  })
}

export function useUploadMeetings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadMeetings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MEETINGS_KEY })
    },
  })
}
