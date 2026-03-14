import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'

import { useGetChatMessages } from '../../api/queries/useChatsQueries'
import AssistantMessage from '../../components/chat/AssistantMessage'
import ChatInput from '../../components/chat/ChatInput'
import UserMessage from '../../components/chat/UserMessage'
import { useChat } from '../../hooks/useChat'

export default function Chat() {
  const { chatId } = useParams<{ chatId?: string }>()
  const { t } = useTranslation()
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

  // Show the centered "new chat" layout only when there is no conversation yet
  // AND the user hasn't sent a message yet. Once they submit, switch to the
  // chat list layout immediately so the retrieving indicator appears inline.
  if (!chatId && !hasSentMessage) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 px-3">
        <h2 className="font-ubuntu text-4xl text-stone-900 dark:text-stone-100">
          {t('chat.howCanIHelp')}
        </h2>
        <ChatInput onSubmit={sendMessage} />
      </div>
    )
  }

  return (
    <div
      ref={chatDivRef}
      className="flex h-screen w-full flex-col overflow-y-scroll"
    >
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 py-3">
        <ul className="space-y-4">
          {messages.map(({ role, content }, index) => {
            if (role === 'user') {
              return <UserMessage key={index} content={content} />
            } else {
              return <AssistantMessage key={index} content={content} />
            }
          })}
          {isRetrieving && !streamingContent && (
            <li className="flex items-center gap-2 px-3 text-stone-500 dark:text-stone-400">
              <ClipLoader size={14} color="currentColor" />
              <span className="text-sm">{t('chat.retrievingInfo')}</span>
            </li>
          )}
          {isStreaming && streamingContent && (
            <AssistantMessage content={streamingContent} />
          )}
        </ul>
      </div>
      <div className="sticky bottom-0 bg-white pt-1.5 dark:bg-stone-800">
        <ChatInput
          onSubmit={message => {
            sendMessage(message)
          }}
        />
      </div>
    </div>
  )
}
