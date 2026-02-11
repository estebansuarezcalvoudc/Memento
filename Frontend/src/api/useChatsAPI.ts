import { useCallback } from 'react'

import fetchBackend from './fetchBackend'

export interface ChatMetadata {
  id: string
  title: string
  started_at: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function useChatsAPI() {
  const createChat = useCallback(
    async (message: string): Promise<ChatMetadata> =>
      fetchBackend('POST', 'conversations', { message: message }),
    [],
  )

  const uploadMessage = useCallback(
    async (id: string, message: string): Promise<string> =>
      fetchBackend(
        'POST',
        `conversations/${id}/chat`,
        { message: message },
      ),
    [],
  )

  const retrieveAllChats = useCallback(
    async (): Promise<ChatMetadata[]> => fetchBackend('GET', 'conversations'),
    [],
  )

  const retrieveChat = useCallback(
    async (id: string): Promise<Message[]> =>
      fetchBackend('GET', `conversations/${id}`),
    [],
  )

  const updateChatTitle = useCallback(
    async (id: string, newTitle: string): Promise<null> =>
      fetchBackend('PUT', `conversations/${id}`, { title: newTitle }),
    [],
  )

  const deleteChat = useCallback(
    async (id: string): Promise<null> =>
      fetchBackend('DELETE', `conversations/${id}`),
    [],
  )

  return {
    createChat,
    uploadMessage,
    retrieveAllChats,
    retrieveChat,
    updateChatTitle,
    deleteChat,
  }
}
