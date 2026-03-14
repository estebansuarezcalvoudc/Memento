import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

import {
  useGetChatMessages,
  useSendMessage,
} from '../../api/queries/useChatsQueries'
import AssistantMessage from '../../components/chat/AssistantMessage'
import ChatInput from '../../components/chat/ChatInput'
import UserMessage from '../../components/chat/UserMessage'

export default function Chat() {
  const { chatId } = useParams<{ chatId: string }>()
  const { data: messages = [] } = useGetChatMessages(chatId)
  const { mutateAsync: sendMessage } = useSendMessage(chatId!)
  const chatDivRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={chatDivRef}
      className="flex h-screen w-full flex-col overflow-y-scroll"
    >
      <div className="mx-auto w-full max-w-3xl space-y-4 py-3 flex-1">
        <ul>
          {messages.map(({ role, content }, index) => {
            if (role === 'user') {
              return <UserMessage key={index} content={content} />
            } else {
              return <AssistantMessage key={index} content={content} />
            }
          })}
        </ul>
      </div>
      <div className="sticky bottom-0 bg-white dark:bg-stone-800">
        <ChatInput onSubmit={async message => { await sendMessage(message) }} />
      </div>
    </div>
  )
}
