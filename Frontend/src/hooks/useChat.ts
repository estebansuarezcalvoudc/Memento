import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

import type { Chat, Message } from '../types/chats'

const CHATS_KEY = ['chats'] as const
const chatKey = (id: string) => ['chat', id] as const

interface ConversationCreatedEvent {
  type: 'conversation_created'
  conversation_id: string
  title: string
}

interface RetrievingEvent {
  type: 'retrieving'
}

interface TokenEvent {
  type: 'token'
  content: string
}

interface DoneEvent {
  type: 'done'
}

interface ErrorEvent {
  type: 'error'
  content: string
}

type ChatEvent =
  | ConversationCreatedEvent
  | RetrievingEvent
  | TokenEvent
  | DoneEvent
  | ErrorEvent

interface UseChatResult {
  sendMessage: (message: string) => void
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  hasSentMessage: boolean
  error: string | null
}

/**
 * Sends a message via WebSocket and streams the LLM reply token by token.
 *
 * @param conversationId  Existing conversation id, or null to create a new one.
 * @param onConversationCreated  Called with the new conversation id when the
 *   server sends a `conversation_created` event (only relevant when
 *   conversationId is null).
 */
export function useChat(
  conversationId: string | null,
  onConversationCreated?: (id: string) => void,
): UseChatResult {
  const queryClient = useQueryClient()
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [hasSentMessage, setHasSentMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a ref to the active conversation id so the WS message handler can
  // reference the latest value without stale closure issues.
  const activeConvIdRef = useRef<string | null>(conversationId)

  const sendMessage = useCallback(
    (message: string) => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Not authenticated')
        return
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(
        `${wsProtocol}//${window.location.host}/api/conversations/ws?token=${token}`,
      )

      setIsStreaming(true)
      setIsRetrieving(false)
      setStreamingContent('')
      setHasSentMessage(true)
      setError(null)

      // Optimistically add the user message to the cache immediately.
      const currentConvId = conversationId
      if (currentConvId) {
        queryClient.setQueryData<Message[]>(chatKey(currentConvId), old => [
          ...(old ?? []),
          { role: 'user', content: message },
        ])
      }

      let resolvedConvId: string | null = currentConvId
      let accumulatedTokens = ''

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            conversation_id: conversationId,
            message,
            current_datetime: new Date().toISOString(),
          }),
        )
      }

      ws.onmessage = (evt: MessageEvent<string>) => {
        let event: ChatEvent
        try {
          event = JSON.parse(evt.data) as ChatEvent
        } catch {
          return
        }

        if (event.type === 'conversation_created') {
          resolvedConvId = event.conversation_id
          activeConvIdRef.current = resolvedConvId

          // Add the user message to the new conversation's cache.
          queryClient.setQueryData<Message[]>(chatKey(resolvedConvId), old => [
            ...(old ?? []),
            { role: 'user', content: message },
          ])

          // Add the new conversation to the chats list cache.
          queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
            old
              ? [
                  {
                    id: event.conversation_id,
                    title: event.title,
                  },
                  ...old,
                ]
              : [{ id: event.conversation_id, title: event.title }],
          )

          onConversationCreated?.(event.conversation_id)
        } else if (event.type === 'retrieving') {
          setIsRetrieving(true)
        } else if (event.type === 'token') {
          setIsRetrieving(false)
          accumulatedTokens += event.content
          setStreamingContent(accumulatedTokens)
        } else if (event.type === 'done') {
          // Persist the full assistant reply into the React Query cache.
          if (resolvedConvId) {
            queryClient.setQueryData<Message[]>(
              chatKey(resolvedConvId),
              old => [
                ...(old ?? []),
                { role: 'assistant', content: accumulatedTokens },
              ],
            )
          }
          setStreamingContent('')
          setIsRetrieving(false)
          setIsStreaming(false)
          setHasSentMessage(false)
          ws.close()
        } else if (event.type === 'error') {
          setError(event.content)
          setIsRetrieving(false)
          setIsStreaming(false)
          setHasSentMessage(false)
          ws.close()
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        setIsRetrieving(false)
        setIsStreaming(false)
        setHasSentMessage(false)
      }

      ws.onclose = () => {
        setIsRetrieving(false)
        setIsStreaming(false)
      }
    },
    [conversationId, queryClient, onConversationCreated],
  )

  return {
    sendMessage,
    streamingContent,
    isStreaming,
    isRetrieving,
    hasSentMessage,
    error,
  }
}
