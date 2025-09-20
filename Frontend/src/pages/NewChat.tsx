import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import SendMessageButton from '../components/chat/SendMessageButton'
import { backendURL } from '../config/urls'
import { useUnshiftChat, type Chat } from '../stores/chatsStore'

export default function NewChat() {
  const [userMessage, setUserMessage] = useState('')
  const navigate = useNavigate()
  const unshiftChat = useUnshiftChat()

  const handleSubmitMessage = async () => {
    if (!userMessage) {
      return
    }

    setUserMessage('')

    const token = localStorage.getItem('access_token')

    const response = await fetch(`${backendURL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message: userMessage }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const newChat: Chat = await response.json()
    navigate(`/chats/${newChat.id}`)
    unshiftChat(newChat)
  }

  return (
    <>
      <h2 className="font-ubuntu mb-8 text-4xl text-stone-900">
        How can I help you?
      </h2>

      <div className="flex w-1/2 items-center rounded-3xl bg-stone-200 p-2">
        <input
          className="font-ubuntu flex-1 rounded-xl p-2 text-sm text-stone-800 outline-none"
          placeholder="Some message..."
          value={userMessage}
          onChange={inputEvent => setUserMessage(inputEvent.target.value)}
        />
        <SendMessageButton
          disabled={userMessage.trim() === ''}
          onClick={handleSubmitMessage}
        />
      </div>
    </>
  )
}
