import { useTranslation } from 'react-i18next'

import ChatInput from './ChatInput'

interface NewChatViewProps {
  onSubmit: (message: string) => void
}

export default function NewChatView({ onSubmit }: NewChatViewProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 px-3">
      <h2 className="font-ubuntu text-4xl text-stone-900 dark:text-stone-100">
        {t('chat.howCanIHelp')}
      </h2>
      <ChatInput onSubmit={onSubmit} />
    </div>
  )
}
