import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

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

  useEffect(() => {
    if (!chatId) {
      return
    }

    const fetchConversation = async () => {
      try {
        const token = localStorage.getItem('access_token')

        if (!token) {
          throw new Error('No access token found')
        }

        const response = await fetch(`/api/conversations/${chatId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const chatMessages = await response.json()
        console.log('API Response:', chatMessages)

        if (chatMessages.messages && Array.isArray(chatMessages.messages)) {
          setMessages(chatMessages.messages)
        } else {
          console.error('Unexpected API response format:', chatMessages)
          setMessages([])
        }
      } catch (error) {
        console.error('Error fetching conversation:', error)
        setMessages([])
      }
    }
    fetchConversation()
  }, [chatId])

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
