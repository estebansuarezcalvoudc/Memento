import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import ChatOptionsDropdown from './chat-options/ChatOptionsDropdown'

interface ChatItemProps {
  chatId: string
  chatTitle: string
}

export default function ChatItem({ chatId, chatTitle }: ChatItemProps) {
  const [isDivHovered, setDivIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const shouldShowOptions = isDivHovered || isMenuOpen
  const isActive = pathname === `/chats/${chatId}`

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <li>
      <div
        className={`flex w-full items-center rounded-xl hover:bg-stone-300 dark:hover:bg-stone-700 ${isActive ? 'bg-stone-200 dark:bg-stone-700' : ''}`}
        onMouseEnter={() => setDivIsHovered(true)}
        onMouseLeave={() => setDivIsHovered(false)}
      >
        <NavLink
          to={`/chats/${chatId}`}
          className="flex-1 cursor-pointer truncate rounded-l-xl py-1.5 text-left text-stone-700 dark:text-stone-300"
        >
          <input
            ref={inputRef}
            className="font-ubuntu pointer-events-none ml-1.5 w-full truncate border-0 bg-transparent text-base text-stone-700 caret-stone-700 shadow-none ring-0 outline-none focus:border-0 focus:shadow-none focus:ring-0 focus:outline-none enabled:underline enabled:decoration-stone-600 enabled:decoration-2 enabled:underline-offset-3 dark:text-stone-300 dark:caret-stone-300 dark:enabled:decoration-stone-300"
            defaultValue={chatTitle}
            disabled
          />
        </NavLink>

        {shouldShowOptions && (
          <ChatOptionsDropdown
            inputRef={inputRef}
            chatId={chatId}
            onMenuStateChange={setIsMenuOpen}
          />
        )}
      </div>
    </li>
  )
}
