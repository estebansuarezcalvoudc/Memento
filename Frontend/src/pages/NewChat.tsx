import SendMessageButton from "../components/chat/SendMessageButton";
import { useState } from "react";
import { backendURL } from "../config/urls";
import { useNavigate } from "react-router-dom";

export default function NewChat() {
  const [userMessage, setUserMessage] = useState('')
  const navigate = useNavigate()

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

    const { id } = await response.json()
    navigate(`/chats/${id}`)
  }

  return <>
    <h2 className="font-ubuntu text-4xl mb-8 text-stone-900">How can I help you?</h2>

    <div className="w-1/2 bg-stone-200 flex items-center rounded-3xl p-2">
      <input
        className="font-ubuntu text-sm text-stone-800 outline-none rounded-xl p-2 flex-1"
        placeholder="Some message..."
        value={userMessage}
        onChange={inputEvent => setUserMessage(inputEvent.target.value)}
      />
      <SendMessageButton disabled={userMessage.trim() === ''} onClick={handleSubmitMessage} />
    </div>
  </>
}
