import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import ChatOptionsDropdown from './chat-options/ChatOptionsDropdown'
import ChatTitleField from './ChatTitleField'
import ChatTitleTooltip from './ChatTitleTooltip'
import {
  useChatTitleTooltip,
  type HoverState,
} from './hooks/useChatTitleTooltip'

interface ChatItemProps {
  chatId: string
  chatTitle?: string
}

export default function ChatItem({ chatId, chatTitle }: ChatItemProps) {
  const [hoverState, setHoverState] = useState<HoverState>('none')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t } = useTranslation()
  const [localTitle, setLocalTitle] = useState(
    chatTitle ?? t('sidebar.newChat'),
  )
  const { pathname } = useLocation()

  useEffect(() => {
    if (chatTitle) {
      setLocalTitle(chatTitle)
    }
  }, [chatTitle])

  const inputRef = useRef<HTMLInputElement>(null)
  const titleLinkRef = useRef<HTMLAnchorElement>(null)
  const { shouldShowTitleTooltip } = useChatTitleTooltip({
    inputRef,
    hoverState,
    isMenuOpen,
    title: localTitle,
  })
  const shouldShowOptions = hoverState !== 'none' || isMenuOpen
  const isActive = pathname === `/chats/${chatId}`

  return (
    <li>
      <div
        className={`relative flex w-full items-center rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 ${isActive ? 'bg-stone-200 dark:bg-stone-700' : ''}`}
        onMouseEnter={() => setHoverState('item')}
        onMouseLeave={() => setHoverState('none')}
      >
        <ChatTitleField
          chatId={chatId}
          title={localTitle}
          titleLinkRef={titleLinkRef}
          inputRef={inputRef}
          onTitleEnter={() => setHoverState('title')}
          onTitleLeave={() => setHoverState('item')}
          onTitleChange={setLocalTitle}
        />

        <ChatTitleTooltip
          visible={shouldShowTitleTooltip}
          title={localTitle}
          anchorElement={titleLinkRef.current}
        />

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
