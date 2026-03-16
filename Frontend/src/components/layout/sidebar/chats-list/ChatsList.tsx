import { useTranslation } from 'react-i18next'

import { useGetChats } from '../../../../api/queries/useChatsQueries'
import { useIsSidebarOpen } from '../../../../stores/sidebarStore'
import ChatItem from './ChatItem'

export default function ChatsList() {
  const { t } = useTranslation()
  const { data: chats, isLoading, error } = useGetChats()
  const isSidebarOpen = useIsSidebarOpen()
  const delayedMessageClass =
    'opacity-0 animate-[fadeIn_300ms_ease-out_150ms_forwards]'

  let chatContent

  if (isLoading) {
    chatContent = (
      <li
        className={`p-4 text-center text-stone-400 dark:text-stone-500 ${delayedMessageClass}`}
      >
        {t('sidebar.loadingConversations')}
      </li>
    )
  } else if (error) {
    chatContent = (
      <li className={`p-4 text-center text-red-400 ${delayedMessageClass}`}>
        {t('sidebar.errorPrefix')}
        {error.message}
      </li>
    )
  } else if (!chats || chats.length === 0) {
    chatContent = (
      <li
        className={`p-4 text-center text-stone-400 dark:text-stone-500 ${delayedMessageClass}`}
      >
        {t('sidebar.noConversations')}
      </li>
    )
  } else {
    chatContent = chats.map(conversation => (
      <ChatItem
        key={conversation.id}
        chatId={conversation.id}
        chatTitle={conversation.title}
      />
    ))
  }

  return (
    <div
      className={`min-h-0 flex-1 transition-opacity duration-300 ${
        isSidebarOpen
          ? 'block opacity-100 delay-150'
          : 'hidden opacity-0 delay-[0ms]'
      } flex h-full flex-col overflow-hidden`}
    >
      <h2 className="font-ubuntu mt-8 mb-2 ml-1.5 flex-shrink-0 truncate text-base text-stone-400 dark:text-stone-500">
        {t('sidebar.chats')}
      </h2>
      <ul className="custom-scrollbar flex-1 overflow-y-auto">{chatContent}</ul>
    </div>
  )
}
