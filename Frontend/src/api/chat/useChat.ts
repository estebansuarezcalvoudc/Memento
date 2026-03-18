import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useReducer, useRef } from 'react'

import type { Message } from '../../types/chats'
import { localISOString } from '../../utils/date'
import { buildWebSocketUrl, createMessageHandler } from './chatMessageHandler'
import { chatKey } from './chatQueryKeys'
import { chatReducer, IDLE_STATE } from './chatReducer'

export interface UseChatResult {
  sendMessage: (message: string) => void
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  hasSentMessage: boolean
  error: string | null
}

export function useChat(
  conversationId: string | null,
  onConversationCreated?: (id: string) => void,
): UseChatResult {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(chatReducer, IDLE_STATE)
  const resolvedConvIdRef = useRef<string | null>(conversationId)
  const accumulatedTokensRef = useRef<string>('')

  const sendMessage = useCallback(
    (message: string) => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        dispatch({ type: 'ERROR', content: 'Not authenticated' })
        return
      }

      resolvedConvIdRef.current = conversationId
      accumulatedTokensRef.current = ''

      if (conversationId) {
        queryClient.setQueryData<Message[]>(chatKey(conversationId), old => [
          ...(old ?? []),
          { role: 'user', content: message },
        ])
      }

      dispatch({ type: 'SEND_MESSAGE' })

      const ws = new WebSocket(buildWebSocketUrl(token))

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            conversation_id: conversationId,
            message,
            current_datetime: localISOString(),
          }),
        )
      }

      ws.onmessage = createMessageHandler({
        dispatch,
        queryClient,
        message,
        resolvedConvIdRef,
        accumulatedTokensRef,
        onConversationCreated,
        ws,
      })

      ws.onerror = () => {
        dispatch({ type: 'ERROR', content: 'WebSocket connection error' })
        ws.close()
      }

      ws.onclose = (event: CloseEvent) => {
        if (event.code === 4001) {
          window.dispatchEvent(new Event('unauthorized'))
        } else if (!event.wasClean) {
          dispatch({
            type: 'ERROR',
            content: 'WebSocket connection closed unexpectedly',
          })
        }
      }
    },
    [conversationId, queryClient, onConversationCreated],
  )

  return { sendMessage, ...state }
}
