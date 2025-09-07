import { useEffect, useState } from 'react'

import { backendURL } from '../../../config/urls'
import { useIsSidebarOpen } from '../../../stores/sidebarStore'
import ChatItem from './ChatItem'

interface Conversation {
  id: string
  title: string
  started_at?: string
}

type ChatListState = 'loading' | 'error' | 'empty' | 'loaded'

export default function ChatsList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isSidebarOpen = useIsSidebarOpen()

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await retrieveChats()
        setConversations(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch conversations',
        )
        console.error('Error fetching conversations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const getState = (): ChatListState => {
    if (loading) return 'loading'
    if (error) return 'error'
    if (conversations.length === 0) return 'empty'
    return 'loaded'
  }

  const renderChatContent = () => {
    switch (getState()) {
      case 'loading':
        return (
          <li className="p-4 text-center text-stone-400">
            Loading conversations...
          </li>
        )
      case 'error':
        return <li className="p-4 text-center text-red-400">Error: {error}</li>
      case 'empty':
        return (
          <li className="p-4 text-center text-stone-400">
            No conversations yet
          </li>
        )
      case 'loaded':
        return conversations.map(conversation => (
          <li key={conversation.id}>
            <ChatItem chatTitle={conversation.title} />
          </li>
        ))
      default:
        return null
    }
  }

  return (
    <div
      className={`min-h-0 flex-1 transition-opacity duration-300 ${
        isSidebarOpen
          ? 'block opacity-100 delay-150'
          : 'hidden opacity-0 delay-[0ms]'
      } flex h-full flex-col overflow-hidden`}
    >
      <h2 className="font-ubuntu mt-8 mb-2 ml-1.5 flex-shrink-0 truncate text-sm text-stone-400">
        Chats
      </h2>
      <ul className="custom-scrollbar flex-1 overflow-y-auto">
        {renderChatContent()}
      </ul>
    </div>
  )
}

async function retrieveChats() {
  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('No access token found')
  }

  const response = await fetch(`${backendURL}/conversations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}
