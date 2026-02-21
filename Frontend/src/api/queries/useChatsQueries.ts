import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Chat, type Message } from '../../types/chats'
import fetchBackend from '../utils/fetchBackend'

async function getAllChats(): Promise<Chat[]> {
  return fetchBackend('GET', 'conversations')
}

async function getChat(id: string): Promise<Message[]> {
  return fetchBackend('GET', `conversations/${id}`)
}

async function createChat(message: string): Promise<Chat> {
  return fetchBackend('POST', 'conversations', { message })
}

async function sendMessage(id: string, message: string): Promise<string> {
  return fetchBackend('POST', `conversations/${id}/chat`, { message })
}

async function updateChatTitle(id: string, title: string): Promise<null> {
  return fetchBackend('PUT', `conversations/${id}`, { title })
}

async function deleteChat(id: string): Promise<null> {
  return fetchBackend('DELETE', `conversations/${id}`)
}

const CHATS_KEY = ['chats'] as const
const chatKey = (id: string) => ['chat', id] as const

export function useGetChats() {
  return useQuery({
    queryKey: CHATS_KEY,
    queryFn: getAllChats,
  })
}

export function useGetChatMessages(id: string | undefined) {
  return useQuery({
    queryKey: chatKey(id!),
    queryFn: () => getChat(id!),
    enabled: !!id,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createChat,
    onSuccess: newChat => {
      queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
        old ? [newChat, ...old] : [newChat],
      )
    },
  })
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) => sendMessage(chatId, message),
    onMutate: async message => {
      await queryClient.cancelQueries({ queryKey: chatKey(chatId) })
      const previous = queryClient.getQueryData<Message[]>(chatKey(chatId))
      queryClient.setQueryData<Message[]>(chatKey(chatId), old => [
        ...(old ?? []),
        { role: 'user', content: message },
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
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateChatTitle(id, title),
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
  return useMutation({
    mutationFn: deleteChat,
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
