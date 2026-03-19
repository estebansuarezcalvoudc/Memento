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
    hasSentMessage,
    error,
  } = useChat(chatId ?? null, onConversationCreated)

  const isInputDisabled = isStreaming || isRetrieving || isThinking
  const isNewChatStreaming =
    !chatId && hasSentMessage && activeConversationId === null

  const shouldShowTransientState = chatId
    ? activeConversationId === chatId
    : hasSentMessage && activeConversationId === null

  const chatDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
    }
  }, [messages, streamingContent, isRetrieving])

  if (!chatId && !isNewChatStreaming && !error) {
    return (
      <NewChatView onSubmit={sendMessage} isInputDisabled={isInputDisabled} />
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
        streamingContent={shouldShowTransientState ? streamingContent : ''}
        isStreaming={shouldShowTransientState ? isStreaming : false}
        isRetrieving={shouldShowTransientState ? isRetrieving : false}
        isThinking={shouldShowTransientState ? isThinking : false}
        isInputDisabled={isInputDisabled}
        onSubmit={sendMessage}
      />
    </>
  )
}
