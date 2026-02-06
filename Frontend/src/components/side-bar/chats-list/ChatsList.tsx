import { useEffect, useState } from 'react'

import { useChats, useSetChats } from '../../../stores/chatsStore'
import { useIsSidebarOpen } from '../../../stores/sidebarStore'
import ChatItem from './ChatItem'

export default function ChatsList() {
  const chats = useChats()
  const setChats = useSetChats()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isSidebarOpen = useIsSidebarOpen()

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await retrieveChats()
        setChats(data)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let chatContent

  if (loading) {
    chatContent = (
      <li className="p-4 text-center text-stone-400">
        Loading conversations...
      </li>
    )
  } else if (error) {
    chatContent = <li className="p-4 text-center text-red-400">Error: {error}</li>
  } else if (chats.length === 0) {
    chatContent = (
      <li className="p-4 text-center text-stone-400">No conversations yet</li>
    )
  } else {
    chatContent = chats.map(conversation => (
      <ChatItem
        key={conversation.id}
        chatId={conversation.id}
        chatTitle={conversation.title}
      />
    ))
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
        {chatContent}
      </ul>
    </div>
  )
}

async function retrieveChats() {
  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('No access token found')
  }

  const response = await fetch('/api/conversations', {
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
