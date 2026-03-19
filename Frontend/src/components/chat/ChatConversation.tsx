import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipLoader } from 'react-spinners'

import type { Message } from '../../types/chats'
import AssistantMessage from './AssistantMessage'
import ChatInput from './ChatInput'
import UserMessage from './UserMessage'

interface ChatConversationProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  isInputDisabled: boolean
  onSubmit: (message: string) => void
}

const ChatConversation = forwardRef<HTMLDivElement, ChatConversationProps>(
  (
    {
      messages,
      streamingContent,
      isStreaming,
      isRetrieving,
      isThinking,
      isInputDisabled,
      onSubmit,
    },
    ref,
  ) => {
    const { t } = useTranslation()

    return (
      <div
        ref={ref}
        className="flex h-screen w-full flex-col overflow-y-scroll px-4"
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
            {isThinking && !streamingContent && (
              <li className="flex items-center gap-2 px-3 text-stone-500 dark:text-stone-400">
                <ClipLoader size={14} color="currentColor" />
                <span className="text-sm">{t('chat.thinking')}</span>
              </li>
            )}
            {isStreaming && streamingContent && (
              <AssistantMessage content={streamingContent} />
            )}
          </ul>
        </div>
        <div className="sticky bottom-0 bg-white pt-1.5 dark:bg-stone-800">
          <ChatInput onSubmit={onSubmit} disabled={isInputDisabled} />
        </div>
      </div>
    )
  },
)

ChatConversation.displayName = 'ChatConversation'

export default ChatConversation
