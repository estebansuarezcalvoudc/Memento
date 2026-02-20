import { useState } from 'react'

import { useSendMessage } from '../../hooks/useChatsQueries'
import SendMessageButton from './SendMessageButton'

interface UserChatInputProps {
  chatId: string
}

export default function ChatInput({ chatId }: UserChatInputProps) {
  const [userMessage, setUserMessage] = useState('')
  const { mutate: sendMessage } = useSendMessage(chatId)

  const handleSubmitMessage = () => {
    if (!userMessage) {
      return
    }

    sendMessage(userMessage)
    setUserMessage('')
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
