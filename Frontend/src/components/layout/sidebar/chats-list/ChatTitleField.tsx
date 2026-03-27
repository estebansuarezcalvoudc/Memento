import { type RefObject } from 'react'
import { NavLink } from 'react-router-dom'

interface ChatTitleFieldProps {
  chatId: string
  title: string
  titleLinkRef: RefObject<HTMLAnchorElement | null>
  inputRef: RefObject<HTMLInputElement | null>
  onTitleEnter: () => void
  onTitleLeave: () => void
  onTitleChange: (value: string) => void
}

export default function ChatTitleField({
  chatId,
  title,
  titleLinkRef,
  inputRef,
  onTitleEnter,
  onTitleLeave,
  onTitleChange,
}: ChatTitleFieldProps) {
  return (
    <div className="flex-1">
      <NavLink
        ref={titleLinkRef}
        to={`/chats/${chatId}`}
        className="block cursor-pointer rounded-l-xl py-1.5 text-left text-stone-700 dark:text-stone-300"
        onMouseEnter={onTitleEnter}
        onMouseLeave={onTitleLeave}
      >
        <input
          ref={inputRef}
          className="font-ubuntu pointer-events-none w-full truncate border-0 bg-transparent pl-1.5 text-base text-stone-700 caret-stone-700 shadow-none ring-0 outline-none focus:border-0 focus:shadow-none focus:ring-0 focus:outline-none enabled:underline enabled:decoration-stone-600 enabled:decoration-2 enabled:underline-offset-3 dark:text-stone-300 dark:caret-stone-300 dark:enabled:decoration-stone-300"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          disabled
        />
      </NavLink>
    </div>
  )
}
