import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { useGetChatMessages } from '../../api/queries/useChatsQueries'
import AssistantMessage from '../../components/chat/AssistantMessage'
import ChatInput from '../../components/chat/ChatInput'
import UserMessage from '../../components/chat/UserMessage'

export default function Chat() {
  const { chatId } = useParams<{ chatId: string }>()
  const { data: messages = [] } = useGetChatMessages(chatId)
  const chatDivRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-screen w-full flex-col px-3">
      <ul
        className="my-3 flex-1 flex-col-reverse overflow-y-auto"
        ref={chatDivRef}
      >
        {messages.map(({ role, content }, index) => {
          if (role === 'user') {
            return <UserMessage key={index} text={content} />
          } else {
            return <AssistantMessage key={index} text={content} />
          }
        })}
      </ul>
      <ChatInput chatId={chatId!} />
    </div>
  )
}
