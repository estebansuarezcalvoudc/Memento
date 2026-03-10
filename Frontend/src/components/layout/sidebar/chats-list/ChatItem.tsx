import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import ChatOptionsDropdown from './chat-options/ChatOptionsDropdown'

interface ChatItemProps {
  chatId: string
  chatTitle: string
}

export default function ChatItem({ chatId, chatTitle }: ChatItemProps) {
  const [isDivHovered, setDivIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const shouldShowOptions = isDivHovered || isMenuOpen

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <li>
      <NavLink to={`/chats/${chatId}`}>
        {({ isActive }) => (
          <div
            className={`flex w-full items-center rounded-xl hover:bg-stone-300 dark:hover:bg-stone-700 ${isActive ? 'bg-stone-200 dark:bg-stone-700' : ''}`}
            onMouseEnter={() => setDivIsHovered(true)}
            onMouseLeave={() => setDivIsHovered(false)}
          >
            <div className="flex-1 cursor-pointer truncate rounded-l-xl py-1.5 text-left text-stone-700 dark:text-stone-300">
              <input
                ref={inputRef}
                className="font-ubuntu pointer-events-none ml-1.5 truncate text-base"
                defaultValue={chatTitle}
                disabled
              />
            </div>

            {shouldShowOptions && (
              <ChatOptionsDropdown
                inputRef={inputRef}
                chatId={chatId}
                onMenuStateChange={setIsMenuOpen}
              />
            )}
          </div>
        )}
      </NavLink>
    </li>
  )
}
