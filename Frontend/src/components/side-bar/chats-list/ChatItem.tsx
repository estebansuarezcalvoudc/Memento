import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import ChatOptionsDropdown from './chat-options/ChatOptionsDropdown'

interface ChatItemProps {
  chatId: string
  chatTitle: string
}

export default function ChatItem({
  chatId,
  chatTitle: conversationName,
}: ChatItemProps) {
  const [isDivHovered, setDivIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const shouldShowOptions = isDivHovered || isMenuOpen

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <li>
      <div
        className="flex w-full items-center rounded-xl hover:bg-stone-200"
        onMouseEnter={() => setDivIsHovered(true)}
        onMouseLeave={() => setDivIsHovered(false)}
      >
        <Link
          to={`/chats/${chatId}`}
          className="flex-1 cursor-pointer truncate rounded-l-xl py-1.5 text-left text-stone-700"
        >
          <input
            ref={inputRef}
            className="font-ubuntu ml-1.5 truncate text-sm pointer-events-none"
            defaultValue={conversationName}
            disabled
          />
        </Link>

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
