import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useEffect, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useDeleteChat,
  useUpdateChatTitle,
} from '../../../../../api/queries/useChatsQueries'
import {
  editImage,
  optionsImage,
  removeImage,
} from '../../../../../assets/buttonsImages'
import ChatOptionsButton from './ChatOptionButton'

interface ChatOptionsDropdownProps {
  inputRef: RefObject<HTMLInputElement | null>
  chatId: string
  onMenuStateChange: (isOpen: boolean) => void
}

export default function ChatOptionsDropdown({
  inputRef,
  chatId,
  onMenuStateChange,
}: ChatOptionsDropdownProps) {
  return (
    <Menu>
      {({ open }) => (
        <ChatActionsDropdown
          inputRef={inputRef}
          chatId={chatId}
          open={open}
          onMenuStateChange={onMenuStateChange}
        />
      )}
    </Menu>
  )
}

interface ChatActionsDropdownProps {
  inputRef: RefObject<HTMLInputElement | null>
  chatId: string
  open: boolean
  onMenuStateChange: (open: boolean) => void
}

function ChatActionsDropdown({
  inputRef,
  chatId,
  open,
  onMenuStateChange,
}: ChatActionsDropdownProps) {
  const { t } = useTranslation()
  useEffect(() => onMenuStateChange(open), [open, onMenuStateChange])

  const { mutate: deleteChatMutate } = useDeleteChat()
  const { mutate: updateTitle } = useUpdateChatTitle()

  const handleRename = () => {
    const input = inputRef.current
    if (!input) {
      return
    }

    const resetInputViewport = () => {
      input.scrollLeft = 0
      requestAnimationFrame(() => {
        input.scrollLeft = 0
      })
    }

    const previousTitle = input.value

    input.disabled = false

    requestAnimationFrame(() => {
      input?.focus()
      input?.select()
    })

    const saveChanges = () => {
      if (!input) {
        return
      }

      const nextTitle = input.value.trim()
      input.disabled = true
      resetInputViewport()

      if (!nextTitle) {
        input.value = previousTitle
        resetInputViewport()
        return
      }

      input.value = nextTitle
      resetInputViewport()

      if (nextTitle === previousTitle) {
        return
      }

      updateTitle({ id: chatId, title: nextTitle })
    }

    input.onblur = saveChanges
    input.onkeydown = e => {
      if (e.key === 'Enter') {
        input?.blur()
      }
    }
  }

  const handleDelete = () => {
    deleteChatMutate(chatId)
  }

  return (
    <div>
      <MenuButton className="inline-flex cursor-pointer items-center justify-center rounded-r-2xl p-2 text-stone-700 focus:ring-0 focus:outline-none dark:text-stone-300">
        {optionsImage}
      </MenuButton>

      <MenuItems
        portal
        transition
        anchor="bottom end"
        className="inline-grid grid-cols-1 gap-1 rounded-xl bg-white p-1 shadow-lg outline-1 outline-stone-300 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-stone-800 dark:outline-stone-600"
      >
        <MenuItem>
          <ChatOptionsButton
            svg={editImage}
            text={t('chatOptions.rename')}
            onClick={handleRename}
          />
        </MenuItem>
        <MenuItem>
          <ChatOptionsButton
            svg={removeImage}
            text={t('chatOptions.delete')}
            textColor="hover:text-red-800 text-red-500"
            hoverColor="hover:bg-red-300"
            onClick={handleDelete}
          />
        </MenuItem>
      </MenuItems>
    </div>
  )
}
