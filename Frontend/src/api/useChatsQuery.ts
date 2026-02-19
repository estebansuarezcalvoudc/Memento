import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import fetchBackend from './fetchBackend'
import type { ChatMetadata } from './useChatsAPI'

export const CHATS_QUERY_KEY = ['chats']

export function useChatsQuery() {
  return useQuery<ChatMetadata[]>({
    queryKey: CHATS_QUERY_KEY,
    queryFn: () => fetchBackend('GET', 'conversations'),
  })
}

export function useCreateChatMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      fetchBackend<{ message: string }>('POST', 'conversations', {
        message,
      }) as Promise<ChatMetadata>,
    onSuccess: newChat => {
      queryClient.setQueryData<ChatMetadata[]>(CHATS_QUERY_KEY, old =>
        old ? [newChat, ...old] : [newChat],
      )
    },
  })
}

export function useDeleteChatMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chatId: string) =>
      fetchBackend('DELETE', `conversations/${chatId}`),
    onSuccess: (_, chatId) => {
      queryClient.setQueryData<ChatMetadata[]>(CHATS_QUERY_KEY, old =>
        old ? old.filter(chat => chat.id !== chatId) : [],
      )
    },
  })
}

export function useUpdateChatTitleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      fetchBackend<{ title: string }>('PUT', `conversations/${id}`, { title }),
    onSuccess: (_, { id, title }) => {
      queryClient.setQueryData<ChatMetadata[]>(CHATS_QUERY_KEY, old =>
        old ? old.map(chat => (chat.id === id ? { ...chat, title } : chat)) : [],
      )
    },
  })
}
