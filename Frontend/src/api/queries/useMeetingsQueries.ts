import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Meeting, type MeetingContentResponse } from '../../types/meetings'
import fetchBackend from '../utils/fetchBackend'

const MEETINGS_KEY = ['meetings'] as const

export function useGetMeetings() {
  return useQuery<Meeting[]>({
    queryKey: MEETINGS_KEY,
    queryFn: () => fetchBackend('GET', 'meetings'),
  })
}

export function useGetMeetingSummary(id: string | undefined) {
  return useQuery<MeetingContentResponse>({
    queryKey: ['meeting', 'summary', id],
    queryFn: async () => {
      const data = await fetchBackend('GET', `meetings/summary/${id}`)
      return { content: data['summary'], title: data.title, date: data.date }
    },
    enabled: !!id,
  })
}

export function useGetMeetingTranscription(id: string | undefined) {
  return useQuery<MeetingContentResponse>({
    queryKey: ['meeting', 'transcription', id],
    queryFn: async () => {
      const data = await fetchBackend('GET', `meetings/transcription/${id}`)
      return {
        content: data['transcription'],
        title: data.title,
        date: data.date,
      }
    },
    enabled: !!id,
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, string>({
    mutationFn: id => fetchBackend('DELETE', `meetings/${id}`),
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
  return useMutation<null, Error, { id: string; updates: Partial<Meeting> }>({
    mutationFn: ({ id, updates }) =>
      fetchBackend('PATCH', `meetings/${id}`, updates),
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
  return useMutation<Meeting[], Error, FormData>({
    mutationFn: formData => fetchBackend('POST', 'meetings', formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MEETINGS_KEY })
    },
  })
}
