import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useSendMessage } from '../../api/queries/useChatsQueries'
import SendMessageButton from './SendMessageButton'

interface UserChatInputProps {
  chatId: string
}

export default function ChatInput({ chatId }: UserChatInputProps) {
  const { t } = useTranslation()
  const [userMessage, setUserMessage] = useState('')
  const { mutateAsync: sendMessage } = useSendMessage(chatId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmitMessage = async () => {
    if (!userMessage.trim()) {
      return
    }

    const message = userMessage
    setUserMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    try {
      await sendMessage(message)
    } catch {
      setUserMessage(message)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserMessage(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitMessage()
    }
  }

  return (
    <div className="font-ubuntu mx-auto mb-2 flex w-full max-w-3xl items-center rounded-2xl bg-stone-200 py-1 pr-1.5 pl-3 text-base dark:bg-stone-700">
      <textarea
        ref={textareaRef}
        rows={1}
        className="mr-2 max-h-[20vh] flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-stone-800 outline-none dark:text-stone-100"
        placeholder={t('chat.messagePlaceholder')}
        value={userMessage}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <SendMessageButton
        disabled={userMessage.trim() === ''}
        onClick={handleSubmitMessage}
      />
    </div>
  )
}
