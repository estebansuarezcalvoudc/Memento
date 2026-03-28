import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useChat } from '../../api/chat/useChat'
import { useGetChatMessages } from '../../api/queries/useChatsQueries'
import ChatConversation from '../../components/chat/ChatConversation'
import NewChatView from '../../components/chat/NewChatView'
import type { ConversationStreamState, Message } from '../../types/chats'

const EMPTY_MESSAGES: Message[] = []

export default function Chat() {
  const { chatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()

  const { data: dialogue } = useGetChatMessages(chatId)
  const messages = dialogue?.messages ?? EMPTY_MESSAGES
  const persistedState = dialogue?.state

  const onConversationCreated = useCallback(
    (id: string) => {
      navigate(`/chats/${id}`, { replace: true })
    },
    [navigate],
  )

  const {
    sendMessage,
    streamingContent,
    isStreaming,
    isRetrieving,
    isThinking,
    activeConversationId,
    isCreatingConversationFromNewChat,
    error,
  } = useChat(chatId ?? null, onConversationCreated)

  const uiState = getChatUiState({
    chatId,
    activeConversationId,
    isCreatingConversationFromNewChat,
    streamingContent,
    isStreaming,
    isRetrieving,
    isThinking,
    persistedState,
    error,
  })

  const chatDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
    }
  }, [messages, streamingContent, isRetrieving])

  if (uiState.showNewChatView) {
    return (
      <NewChatView
        onSubmit={sendMessage}
        isInputDisabled={uiState.isInputDisabled}
      />
    )
  }

  return (
    <>
      {error && (
        <div className="mb-2 rounded bg-red-100 px-4 py-3 text-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      <ChatConversation
        ref={chatDivRef}
        messages={messages}
        streamingContent={
          uiState.showTransientState ? uiState.streamingContent : ''
        }
        isStreaming={uiState.showTransientState ? uiState.isStreaming : false}
        isRetrieving={uiState.showTransientState ? uiState.isRetrieving : false}
        isThinking={uiState.showTransientState ? uiState.isThinking : false}
        isInputDisabled={uiState.isInputDisabled}
        onSubmit={sendMessage}
      />
    </>
  )
}

interface ChatUiState {
  showNewChatView: boolean
  showTransientState: boolean
  isInputDisabled: boolean
  isStreaming: boolean
  streamingContent: string
  isRetrieving: boolean
  isThinking: boolean
}

interface ChatUiStateParams {
  chatId?: string
  activeConversationId: string | null
  isCreatingConversationFromNewChat: boolean
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  persistedState: ConversationStreamState | undefined
  error: string | null
}

interface PersistedTransientState {
  inProgress: boolean
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  streamingContent: string
}
function getChatUiState({
  chatId,
  activeConversationId,
  isCreatingConversationFromNewChat,
  streamingContent,
  isStreaming,
  isRetrieving,
  isThinking,
  persistedState,
  error,
}: ChatUiStateParams): ChatUiState {
  const persisted = getPersistedTransientState(persistedState)
  const effectiveIsStreaming = isStreaming || persisted.isStreaming
  const effectiveIsRetrieving = isRetrieving || persisted.isRetrieving
  const effectiveIsThinking = isThinking || persisted.isThinking
  const effectiveStreamingContent =
    streamingContent || persisted.streamingContent
  const isInputDisabled =
    effectiveIsStreaming ||
    effectiveIsRetrieving ||
    effectiveIsThinking ||
    persisted.inProgress

  const showNewChatView =
    !chatId && !isCreatingConversationFromNewChat && !error
  const isActiveConversation = Boolean(
    chatId && activeConversationId === chatId,
  )
  const showTransientState =
    isActiveConversation ||
    isCreatingConversationFromNewChat ||
    persisted.inProgress

  return {
    showNewChatView,
    showTransientState,
    isInputDisabled,
    isStreaming: effectiveIsStreaming,
    streamingContent: effectiveStreamingContent,
    isRetrieving: effectiveIsRetrieving,
    isThinking: effectiveIsThinking,
  }
}

function getPersistedTransientState(
  persistedState: ConversationStreamState | undefined,
): PersistedTransientState {
  const status = persistedState?.status ?? 'idle'

  return {
    inProgress: status !== 'idle',
    isStreaming: status === 'streaming',
    isRetrieving: status === 'retrieving',
    isThinking: status === 'thinking',
    streamingContent:
      status === 'streaming' ? (persistedState?.partialReply ?? '') : '',
  }
}
