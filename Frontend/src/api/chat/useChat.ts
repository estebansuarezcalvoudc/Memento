import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useReducer, useRef } from 'react'

import type { ConversationDialogueResponse } from '../../types/chats'
import { localISOString } from '../../utils/date'
import { buildWebSocketUrl, createMessageHandler } from './chatMessageHandler'
import { chatKey, getAuthSessionKey } from './chatQueryKeys'
import { chatReducer, IDLE_STATE } from './chatReducer'

export interface UseChatResult {
  sendMessage: (message: string) => void
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  activeConversationId: string | null
  isCreatingConversationFromNewChat: boolean
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
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(
    () => () => {
      wsRef.current?.close()
      wsRef.current = null
    },
    [],
  )

  useEffect(() => {
    if (conversationId) {
      dispatch({ type: 'CLEAR_NEW_CHAT_CREATION' })
    }
  }, [conversationId])

  const sendMessage = useCallback(
    (message: string) => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        dispatch({ type: 'ERROR', content: 'Not authenticated' })
        return
      }

      const sessionKey = getAuthSessionKey()

      resolvedConvIdRef.current = conversationId
      accumulatedTokensRef.current = ''

      if (conversationId) {
        queryClient.setQueryData<ConversationDialogueResponse>(
          chatKey(sessionKey, conversationId),
          old => ({
            messages: [
              ...(old?.messages ?? []),
              { role: 'user', content: message },
            ],
            state: old?.state ?? {
              status: 'idle',
              partialReply: '',
              updatedAt: null,
              error: null,
            },
          }),
        )
      }

      dispatch({ type: 'SEND_MESSAGE', conversationId })

      wsRef.current?.close()

      const ws = new WebSocket(buildWebSocketUrl(token))
      wsRef.current = ws

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
        sessionKey,
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
        if (wsRef.current === ws) {
          wsRef.current = null
        }
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
