import type { QueryClient } from '@tanstack/react-query'

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

interface ThinkingStartEvent {
  type: 'thinking_start'
}

interface ThinkingEndEvent {
  type: 'thinking_end'
}

interface TokenEvent {
  type: 'token'
  content: string
}

interface DoneEvent {
  type: 'done'
}

interface TitleEvent {
  type: 'title'
  title: string
}

interface ErrorEvent {
  type: 'error'
  content: string
}

type ChatEvent =
  | ConversationCreatedEvent
  | RetrievingEvent
  | ThinkingStartEvent
  | ThinkingEndEvent
  | TokenEvent
  | DoneEvent
  | TitleEvent
  | ErrorEvent

interface MessageHandlerDeps {
  dispatch: React.Dispatch<ChatAction>
  queryClient: Pick<QueryClient, 'setQueryData' | 'invalidateQueries'>
  message: string
  resolvedConvIdRef: React.RefObject<string | null>
  accumulatedTokensRef: React.RefObject<string>
  onConversationCreated?: (id: string) => void
  ws: Pick<WebSocket, 'close'>
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
      dispatch({
        type: 'SET_ACTIVE_CONVERSATION',
        conversationId: event.conversation_id,
      })

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
    } else if (event.type === 'thinking_start') {
      dispatch({ type: 'THINKING_START' })
    } else if (event.type === 'thinking_end') {
      dispatch({ type: 'THINKING_END' })
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
    } else if (event.type === 'title') {
      // Invalidate so useGetChats refetches and the sidebar updates automatically
      void queryClient.invalidateQueries({ queryKey: CHATS_KEY })
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
