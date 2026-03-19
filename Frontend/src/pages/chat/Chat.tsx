import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useChat } from '../../api/chat/useChat'
import { useGetChatMessages } from '../../api/queries/useChatsQueries'
import ChatConversation from '../../components/chat/ChatConversation'
import NewChatView from '../../components/chat/NewChatView'

export default function Chat() {
  const { chatId } = useParams<{ chatId?: string }>()
  const navigate = useNavigate()

  const { data: messages = [] } = useGetChatMessages(chatId)

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
    isStreaming,
    isRetrieving,
    isThinking,
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
        streamingContent={uiState.showTransientState ? streamingContent : ''}
        isStreaming={uiState.showTransientState ? isStreaming : false}
        isRetrieving={uiState.showTransientState ? isRetrieving : false}
        isThinking={uiState.showTransientState ? isThinking : false}
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
}

interface ChatUiStateParams {
  chatId?: string
  activeConversationId: string | null
  isCreatingConversationFromNewChat: boolean
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  error: string | null
}

function getChatUiState({
  chatId,
  activeConversationId,
  isCreatingConversationFromNewChat,
  isStreaming,
  isRetrieving,
  isThinking,
  error,
}: ChatUiStateParams): ChatUiState {
  const isInputDisabled = isStreaming || isRetrieving || isThinking
  const showNewChatView =
    !chatId && !isCreatingConversationFromNewChat && !error
  const showTransientState = chatId
    ? activeConversationId === chatId
    : isCreatingConversationFromNewChat

  return {
    showNewChatView,
    showTransientState,
    isInputDisabled,
  }
}
