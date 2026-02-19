import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import fetchBackend from './fetchBackend'
import type { MeetingMetadataResponse } from './useMeetingsAPI'

export interface Meeting {
  id: string
  title: string
  date: string
}

export const MEETINGS_QUERY_KEY = ['meetings']

export function useMeetingsQuery() {
  return useQuery<Meeting[]>({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: () => fetchBackend('GET', 'meetings'),
  })
}

export function useUploadMeetingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetchBackend('POST', 'meetings', formData) as Promise<
        MeetingMetadataResponse[]
      >,
    onSuccess: newMeetings => {
      queryClient.setQueryData<Meeting[]>(MEETINGS_QUERY_KEY, old =>
        old ? [...old, ...newMeetings] : newMeetings,
      )
    },
  })
}

export function useDeleteMeetingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchBackend('DELETE', `meetings/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Meeting[]>(MEETINGS_QUERY_KEY, old =>
        old ? old.filter(meeting => meeting.id !== id) : [],
      )
    },
  })
}

export function useUpdateMeetingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Meeting>
    }) => fetchBackend('PATCH', `meetings/${id}`, updates),
    onSuccess: (_, { id, updates }) => {
      queryClient.setQueryData<Meeting[]>(MEETINGS_QUERY_KEY, old =>
        old
          ? old.map(meeting =>
              meeting.id === id ? { ...meeting, ...updates } : meeting,
            )
          : [],
      )
    },
  })
}
