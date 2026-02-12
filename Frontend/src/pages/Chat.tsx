import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import useChatsAPI from '../api/useChatsAPI'
import AssistantMessage from '../components/chat/AssistantMessage'
import ChatInput from '../components/chat/ChatInput'
import UserMessage from '../components/chat/UserMessage'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chat() {
  const { chatId } = useParams<{ chatId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const chatDivRef = useRef<HTMLUListElement | null>(null)
  const { retrieveChat } = useChatsAPI()

  useEffect(() => {
    if (!chatId) {
      return
    }

    const fetchConversation = async () => {
      const chatMessages = await retrieveChat(chatId)
      setMessages(chatMessages)
    }
    fetchConversation()
  }, [chatId, retrieveChat])

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
      <ChatInput chatId={chatId} setMessages={setMessages} />
    </div>
  )
}
