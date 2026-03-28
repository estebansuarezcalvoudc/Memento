import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Chat, type ConversationDialogueResponse } from '../../types/chats'
import { chatKey, chatsKey, getAuthSessionKey } from '../chat/chatQueryKeys'
import fetchBackend from '../utils/fetchBackend'

export function useGetChats() {
  const sessionKey = getAuthSessionKey()
  const chatsQueryKey = chatsKey(sessionKey)

  return useQuery<Chat[]>({
    queryKey: chatsQueryKey,
    queryFn: () => fetchBackend('GET', 'conversations'),
  })
}

export function useGetChatMessages(id: string | undefined) {
  const sessionKey = getAuthSessionKey()

  return useQuery<ConversationDialogueResponse>({
    queryKey: chatKey(sessionKey, id!),
    queryFn: () => fetchBackend('GET', `conversations/${id}`),
    enabled: !!id,
    refetchInterval: query => {
      const current = query.state.data
      if (!current) {
        return false
      }

      if (Array.isArray(current)) {
        return false
      }

      if (!current.state) {
        return false
      }

      return current.state.status === 'idle' ? false : 1000
    },
  })
}

export function useUpdateChatTitle() {
  const queryClient = useQueryClient()
  const sessionKey = getAuthSessionKey()
  const chatsQueryKey = chatsKey(sessionKey)

  return useMutation<null, Error, { id: string; title: string }>({
    mutationFn: ({ id, title }) =>
      fetchBackend('PUT', `conversations/${id}`, { title }),
    onMutate: ({ id, title }) => {
      const previous = queryClient.getQueryData<Chat[]>(chatsQueryKey)
      queryClient.setQueryData<Chat[]>(
        chatsQueryKey,
        old =>
          old?.map(c => (c.id === id ? { ...c, title } : c)) ?? previous ?? [],
      )
      return { previous }
    },
    onSuccess: (_, { id, title }) => {
      queryClient.setQueryData<Chat[]>(chatsQueryKey, old =>
        old?.map(c => (c.id === id ? { ...c, title } : c)),
      )
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(chatsQueryKey, context?.previous)
      queryClient.invalidateQueries({ queryKey: chatsQueryKey })
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()
  const sessionKey = getAuthSessionKey()
  const chatsQueryKey = chatsKey(sessionKey)

  return useMutation<null, Error, string>({
    mutationFn: id => fetchBackend('DELETE', `conversations/${id}`),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: chatsQueryKey })
      const previous = queryClient.getQueryData<Chat[]>(chatsQueryKey)
      queryClient.setQueryData<Chat[]>(
        chatsQueryKey,
        old => old?.filter(c => c.id !== id) ?? [],
      )
      return { previous }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(chatsQueryKey, context?.previous)
      queryClient.invalidateQueries({ queryKey: chatsQueryKey })
    },
  })
}
