import { useChatsQuery } from '../../../api/useChatsQuery'
import { useIsSidebarOpen } from '../../../stores/sidebarStore'
import ChatItem from './ChatItem'

export default function ChatsList() {
  const { data: chats, isLoading, isError } = useChatsQuery()
  const isSidebarOpen = useIsSidebarOpen()

  let chatContent

  if (isLoading) {
    chatContent = (
      <li className="p-4 text-center text-stone-400">
        Loading conversations...
      </li>
    )
  } else if (isError) {
    chatContent = (
      <li className="p-4 text-center text-red-400">Error: Failed to fetch conversations</li>
    )
  } else if (!chats || chats.length === 0) {
    chatContent = (
      <li className="p-4 text-center text-stone-400">No conversations yet</li>
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
      className={`min-h-0 flex-1 transition-opacity duration-300 ${isSidebarOpen
          ? 'block opacity-100 delay-150'
          : 'hidden opacity-0 delay-[0ms]'
        } flex h-full flex-col overflow-hidden`}
    >
      <h2 className="font-ubuntu mt-8 mb-2 ml-1.5 flex-shrink-0 truncate text-sm text-stone-400">
        Chats
      </h2>
      <ul className="custom-scrollbar flex-1 overflow-y-auto">{chatContent}</ul>
    </div>
  )
}
