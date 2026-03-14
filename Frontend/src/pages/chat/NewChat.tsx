import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import ChatInput from '../../components/chat/ChatInput'
import { useChat } from '../../hooks/useChat'

export default function NewChat() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleConversationCreated = useCallback(
    (id: string) => {
      navigate(`/chats/${id}`)
    },
    [navigate],
  )

  const { sendMessage } = useChat(null, handleConversationCreated)

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 px-3">
      <h2 className="font-ubuntu text-4xl text-stone-900 dark:text-stone-100">
        {t('chat.howCanIHelp')}
      </h2>
      <ChatInput onSubmit={sendMessage} />
    </div>
  )
}
