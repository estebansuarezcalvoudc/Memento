import { useState } from 'react'

import ChatButtonSpan from './ChatButtonSpan'
import ChatOptionsDropdown from './ChatOptionsDropdown'

interface chatButtonProps {
  chatTitle: string
}

export default function ChatButton({
  chatTitle: conversationName,
}: chatButtonProps) {
  const [isDivHovered, setDivIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const shouldShowOptions = isDivHovered || isMenuOpen

  return (
    <div
      className="flex w-full items-center rounded-xl hover:bg-stone-200"
      onMouseEnter={() => setDivIsHovered(true)}
      onMouseLeave={() => setDivIsHovered(false)}
    >
      <button
        className="flex-1 cursor-pointer truncate rounded-l-xl py-1.5 text-left text-stone-700"
        onClick={() => console.log('conversation button triggered')}
      >
        <ChatButtonSpan>{conversationName}</ChatButtonSpan>
      </button>

      {shouldShowOptions && (
        <ChatOptionsDropdown onMenuStateChange={setIsMenuOpen} />
      )}
    </div>
  )
}
