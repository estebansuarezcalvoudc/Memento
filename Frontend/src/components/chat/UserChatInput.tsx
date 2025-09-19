import { useState } from 'react'

import { backendURL } from '../../config/urls'
import SendMessageButton from './SendMessageButton'

interface UserChatInputProps {
  chatId: string
  setMessages: any
}

export default function UserChatInput({
  chatId,
  setMessages,
}: UserChatInputProps) {
  const [userMessage, setUserMessage] = useState('')

  const handleSubmitMessage = async () => {
    if (!userMessage) {
      return
    }

    setMessages(prevMessages => [...prevMessages, { role: 'user', content: userMessage }])
    setUserMessage('')

    const token = localStorage.getItem('access_token')

    const response = await fetch(`${backendURL}/conversations/${chatId}/chat`, {
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

    const assistantResponse = response.text()
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'assistant', content: assistantResponse },
    ])
  }

  return (
    <div className="font-ubuntu mb-2.5 px-2 flex h-12 items-center rounded-3xl bg-stone-200 pl-3 text-sm">
      <input
        className="flex-1 bg-transparent text-stone-800 outline-none"
        placeholder="Some message..."
        value={userMessage}
        onChange={inputEvent => setUserMessage(inputEvent.target.value)}
      />
      <SendMessageButton disabled={userMessage.trim() === ''} onClick={handleSubmitMessage} />
    </div>
  )
}
