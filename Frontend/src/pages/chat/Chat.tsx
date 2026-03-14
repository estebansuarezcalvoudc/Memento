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
    <div className="flex h-screen w-full flex-col">
      <ul className="my-3 flex-1 overflow-y-auto" ref={chatDivRef}>
        <div className="mx-auto px-3 md:w-full lg:w-4xl">
          {messages.map(({ role, content }, index) => {
            if (role === 'user') {
              return <UserMessage key={index} content={content} />
            } else {
              return <AssistantMessage key={index} content={content} />
            }
          })}
        </div>
      </ul>
      <div className="mx-auto w-full px-3 pb-3 sm:w-full md:w-3/4 lg:w-1/2">
        <ChatInput chatId={chatId!} />
      </div>
    </div>
  )
}
