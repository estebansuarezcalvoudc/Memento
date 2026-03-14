import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useGetChatMessages } from '../../api/queries/useChatsQueries'
import ChatConversation from '../../components/chat/ChatConversation'
import NewChatView from '../../components/chat/NewChatView'
import { useChat } from '../../hooks/useChat'

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
    hasSentMessage,
  } = useChat(chatId ?? null, onConversationCreated)

  const chatDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
    }
  }, [messages, streamingContent, isRetrieving])

  if (!chatId && !hasSentMessage) {
    return <NewChatView onSubmit={sendMessage} />
  }

  return (
    <ChatConversation
      ref={chatDivRef}
      messages={messages}
      streamingContent={streamingContent}
      isStreaming={isStreaming}
      isRetrieving={isRetrieving}
      onSubmit={sendMessage}
    />
  )
}
