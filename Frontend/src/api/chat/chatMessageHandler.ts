import { useQueryClient } from '@tanstack/react-query'

import type { Chat, Message } from '../../types/chats'
import { chatKey, CHATS_KEY } from './chatQueryKeys'
import type { ChatAction } from './chatReducer'

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

interface MessageHandlerDeps {
  dispatch: React.Dispatch<ChatAction>
  queryClient: ReturnType<typeof useQueryClient>
  message: string
  conversationId: string | null
  resolvedConvIdRef: React.RefObject<string | null>
  accumulatedTokensRef: React.RefObject<string>
  onConversationCreated?: (id: string) => void
  ws: WebSocket
}

export function createMessageHandler(
  deps: MessageHandlerDeps,
): (evt: MessageEvent<string>) => void {
  const {
    dispatch,
    queryClient,
    message,
    resolvedConvIdRef,
    accumulatedTokensRef,
    onConversationCreated,
    ws,
  } = deps

  return (evt: MessageEvent<string>) => {
    let event: ChatEvent
    try {
      event = JSON.parse(evt.data) as ChatEvent
    } catch {
      return
    }

    if (event.type === 'conversation_created') {
      resolvedConvIdRef.current = event.conversation_id

      queryClient.setQueryData<Message[]>(
        chatKey(event.conversation_id),
        old => [...(old ?? []), { role: 'user', content: message }],
      )

      queryClient.setQueryData<Chat[]>(CHATS_KEY, old =>
        old
          ? [{ id: event.conversation_id, title: event.title }, ...old]
          : [{ id: event.conversation_id, title: event.title }],
      )

      onConversationCreated?.(event.conversation_id)
    } else if (event.type === 'retrieving') {
      dispatch({ type: 'RETRIEVING' })
    } else if (event.type === 'token') {
      accumulatedTokensRef.current += event.content
      dispatch({ type: 'TOKEN', content: accumulatedTokensRef.current })
    } else if (event.type === 'done') {
      const convId = resolvedConvIdRef.current
      if (convId) {
        queryClient.setQueryData<Message[]>(chatKey(convId), old => [
          ...(old ?? []),
          { role: 'assistant', content: accumulatedTokensRef.current },
        ])
      }
      dispatch({ type: 'DONE' })
      ws.close()
    } else if (event.type === 'error') {
      dispatch({ type: 'ERROR', content: event.content })
      ws.close()
    }
  }
}

export function buildWebSocketUrl(token: string): string {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${wsProtocol}//${window.location.host}/api/conversations/ws?token=${encodeURIComponent(token)}`
}
