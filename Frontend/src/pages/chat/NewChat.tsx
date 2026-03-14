import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useCreateChat } from '../../api/queries/useChatsQueries'
import ChatInput from '../../components/chat/ChatInput'

export default function NewChat() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mutateAsync: createChat } = useCreateChat()

  const handleSubmit = async (message: string) => {
    const newChat = await createChat(message)
    navigate(`/chats/${newChat.id}`)
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 px-3">
      <h2 className="font-ubuntu text-4xl text-stone-900 dark:text-stone-100">
        {t('chat.howCanIHelp')}
      </h2>
      <ChatInput onSubmit={handleSubmit} />
    </div>
  )
}
