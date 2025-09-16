import { useState } from 'react'

import { backendURL } from '../../config/urls'

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
    <div className="font-ubuntu m-3 mb-2.5 flex h-12 items-center rounded-3xl bg-stone-200 pl-3 text-sm">
      <input
        className="flex-1 bg-transparent text-stone-800 outline-none"
        placeholder="Some message..."
        value={userMessage}
        onChange={inputEvent => setUserMessage(inputEvent.target.value)}
      />
      <button
        className="mr-2 cursor-pointer rounded-4xl p-1.5 text-stone-900 hover:bg-stone-400 disabled:opacity-50"
        onClick={handleSubmitMessage}
        disabled={userMessage.trim() === ''}
      >
        {sendMessageImage}
      </button>
    </div>
  )
}

const sendMessageImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-send-2"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z" />
    <path d="M6.5 12h14.5" />
  </svg>
)
