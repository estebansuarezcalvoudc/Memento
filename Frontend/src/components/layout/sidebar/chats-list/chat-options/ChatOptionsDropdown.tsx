import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useEffect, type RefObject } from 'react'

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
  useEffect(() => onMenuStateChange(open), [open, onMenuStateChange])

  const { mutate: deleteChatMutate } = useDeleteChat()
  const { mutate: updateTitle } = useUpdateChatTitle()

  const handleRename = () => {
    const input = inputRef.current
    if (!input) {
      return
    }

    input.disabled = false

    requestAnimationFrame(() => {
      input?.focus()
      input?.select()
    })

    const saveChanges = () => {
      if (!input) {
        return
      }
      input.disabled = true
      updateTitle({ id: chatId, title: input.value })
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
      <MenuButton className="inline-flex cursor-pointer items-center justify-center rounded-r-2xl p-2 focus:ring-0 focus:outline-none">
        {optionsImage}
      </MenuButton>

      <MenuItems
        portal
        transition
        anchor="bottom end"
        className="rounded-md bg-white shadow-lg outline-1 outline-stone-300 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
      >
        <MenuItem>
          <ChatOptionsButton
            svg={editImage}
            text="Rename"
            onClick={handleRename}
          />
        </MenuItem>
        <MenuItem>
          <ChatOptionsButton
            svg={removeImage}
            text="Delete"
            textColor="text-red-500"
            hoverColor="hover:bg-red-50"
            onClick={handleDelete}
          />
        </MenuItem>
      </MenuItems>
    </div>
  )
}
