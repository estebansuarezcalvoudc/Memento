import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createChat,
  deleteChat,
  getAllChats,
  getChat,
  sendMessage,
  updateChatTitle,
  type Chat,
  type Message,
} from '../api/chatsAPI'

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
    onSuccess: (newChat) => {
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
    onMutate: (message) => {
      const previous = queryClient.getQueryData<Message[]>(chatKey(chatId))
      queryClient.setQueryData<Message[]>(chatKey(chatId), old => [
        ...(old ?? []),
        { role: 'user', content: message },
      ])
      return { previous }
    },
    onSuccess: (assistantResponse) => {
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
    onSuccess: (_, { id, title }) => {
      queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
        old?.map(c => (c.id === id ? { ...c, title } : c)),
      )
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChat,
    onMutate: (id) => {
      const previous = queryClient.getQueryData<Chat[]>(CHATS_KEY)
      queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
        old?.filter(c => c.id !== id) ?? [],
      )
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(CHATS_KEY, context?.previous)
      queryClient.invalidateQueries({ queryKey: CHATS_KEY })
    },
  })
}
