import { useState } from 'react'

import { useSendMessage } from '../../api/queries/useChatsQueries'
import SendMessageButton from './SendMessageButton'

interface UserChatInputProps {
  chatId: string
}

export default function ChatInput({ chatId }: UserChatInputProps) {
  const [userMessage, setUserMessage] = useState('')
  const { mutateAsync: sendMessage } = useSendMessage(chatId)

  const handleSubmitMessage = async () => {
    if (!userMessage) {
      return
    }

    const message = userMessage
    setUserMessage('')
    try {
      await sendMessage(message)
    } catch {
      setUserMessage(message)
    }
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
