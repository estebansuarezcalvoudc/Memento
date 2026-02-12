import { useState } from 'react'

import useChatsAPI from '../../api/useChatsAPI'
import { type Message } from '../../pages/Chat'
import SendMessageButton from './SendMessageButton'

interface UserChatInputProps {
  chatId: string
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

export default function ChatInput({ chatId, setMessages }: UserChatInputProps) {
  const [userMessage, setUserMessage] = useState('')
  const { uploadMessage } = useChatsAPI()

  const handleSubmitMessage = async () => {
    if (!userMessage) {
      return
    }

    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: userMessage },
    ])
    setUserMessage('')

    const assistantResponse = await uploadMessage(chatId, userMessage)
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'assistant', content: assistantResponse },
    ])
  }

  return (
    <div className="font-ubuntu mb-2.5 flex h-12 items-center rounded-3xl bg-stone-200 px-2 pl-3 text-sm">
      <input
        className="flex-1 bg-transparent text-stone-800 outline-none"
        placeholder="Some message..."
        value={userMessage}
        onChange={inputEvent => setUserMessage(inputEvent.target.value)}
      />
      <SendMessageButton
        disabled={userMessage.trim() === ''}
        onClick={handleSubmitMessage}
      />
    </div>
  )
}
