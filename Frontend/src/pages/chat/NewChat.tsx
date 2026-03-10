import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCreateChat } from '../../api/queries/useChatsQueries'
import SendMessageButton from '../../components/chat/SendMessageButton'

export default function NewChat() {
  const [userMessage, setUserMessage] = useState('')
  const navigate = useNavigate()
  const { mutateAsync: createChat } = useCreateChat()

  const handleSubmitMessage = async () => {
    if (!userMessage) {
      return
    }

    const message = userMessage
    setUserMessage('')
    try {
      const newChat = await createChat(message)
      navigate(`/chats/${newChat.id}`)
    } catch {
      setUserMessage(message)
    }
  }

  return (
    <>
      <h2 className="font-ubuntu mb-8 text-4xl text-stone-900 dark:text-stone-100">
        How can I help you?
      </h2>

      <div className="flex w-1/2 items-center rounded-3xl bg-stone-200 p-2 dark:bg-stone-700">
        <input
          className="font-ubuntu flex-1 rounded-xl p-2 text-base text-stone-800 outline-none dark:bg-transparent dark:text-stone-100"
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
