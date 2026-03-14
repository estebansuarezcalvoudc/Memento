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
  const chatDivRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-screen w-full flex-col">
      <ul ref={chatDivRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-4 py-3">
          {messages.map(({ role, content }, index) => {
            if (role === 'user') {
              return <UserMessage key={index} content={content} />
            } else {
              return <AssistantMessage key={index} content={content} />
            }
          })}
        </div>
      </ul>
      <ChatInput onSubmit={message => sendMessage(message)} />
    </div>
  )
}
