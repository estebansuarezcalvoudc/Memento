import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Chat, type Message } from '../../types/chats'
import fetchBackend from '../utils/fetchBackend'

const CHATS_KEY = ['chats'] as const
const chatKey = (id: string) => ['chat', id] as const

export function useGetChats() {
  return useQuery<Chat[]>({
    queryKey: CHATS_KEY,
    queryFn: () => fetchBackend('GET', 'conversations'),
  })
}

export function useGetChatMessages(id: string | undefined) {
  return useQuery<Message[]>({
    queryKey: chatKey(id!),
    queryFn: () => fetchBackend('GET', `conversations/${id}`),
    enabled: !!id,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  return useMutation<Chat, Error, string>({
    mutationFn: message =>
      fetchBackend('POST', 'conversations', {
        message,
        current_datetime: new Date().toISOString(),
      }),
    onSuccess: newChat => {
      queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
        old ? [newChat, ...old] : [newChat],
      )
    },
  })
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation<string, Error, string>({
    mutationFn: message =>
      fetchBackend('POST', `conversations/${chatId}/chat`, {
        message,
        current_datetime: new Date().toISOString(),
      }),
    onMutate: async message => {
      await queryClient.cancelQueries({ queryKey: chatKey(chatId) })
      const previous = queryClient.getQueryData<Message[]>(chatKey(chatId))
      queryClient.setQueryData<Message[]>(chatKey(chatId), old => [
        ...(old ?? []),
        {
          role: 'user',
          content: message,
          current_datetime: new Date().toISOString(),
        },
      ])
      return { previous }
    },
    onSuccess: assistantResponse => {
      queryClient.setQueryData<Message[]>(chatKey(chatId), old => [
        ...(old ?? []),
        { role: 'assistant', content: assistantResponse },
      ])
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(chatKey(chatId), context?.previous)
    },
  })
}

export function useUpdateChatTitle() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, { id: string; title: string }>({
    mutationFn: ({ id, title }) =>
      fetchBackend('PUT', `conversations/${id}`, { title }),
    onMutate: ({ id, title }) => {
      const previous = queryClient.getQueryData<Chat[]>(CHATS_KEY)
      queryClient.setQueryData<Chat[]>(
        CHATS_KEY,
        old =>
          old?.map(c => (c.id === id ? { ...c, title } : c)) ?? previous ?? [],
      )
      return { previous }
    },
    onSuccess: (_, { id, title }) => {
      queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
        old?.map(c => (c.id === id ? { ...c, title } : c)),
      )
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(CHATS_KEY, context?.previous)
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, string>({
    mutationFn: id => fetchBackend('DELETE', `conversations/${id}`),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: CHATS_KEY })
      const previous = queryClient.getQueryData<Chat[]>(CHATS_KEY)
      queryClient.setQueryData<Chat[]>(
        CHATS_KEY,
        old => old?.filter(c => c.id !== id) ?? [],
      )
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(CHATS_KEY, context?.previous)
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}
