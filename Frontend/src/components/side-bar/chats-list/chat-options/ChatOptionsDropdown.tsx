import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useEffect, type RefObject } from 'react'

import { backendURL } from '../../../../config/urls'
import { useDeleteChat } from '../../../../stores/chatsStore'
import ChatOptionsButton from './ChatOptionButton'

interface ChatOptionsDropdownProps {
  inputRef: RefObject<HTMLInputElement>
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
  inputRef: RefObject<HTMLInputElement>
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

  const deleteChat = useDeleteChat()

  const handleRename = () => {
    inputRef.current.disabled = false

    inputRef.current.onblur = async () => {
      inputRef.current.disabled = true

      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('No access token found')
      }

      const url = `${backendURL}/conversations/${chatId}`
      console.log(url)
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: inputRef.current.value,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }
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
            svg={deleteImage}
            text="Delete"
            textColor="text-red-500"
            hoverColor="hover:bg-red-50"
            onClick={() => {
              handleDelete(chatId)
              deleteChat(chatId)
            }}
          />
        </MenuItem>
      </MenuItems>
    </div>
  )
}

async function handleDelete(chatId: string) {
  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('No access token found')
  }

  const url = `${backendURL}/conversations/${chatId}`
  console.log(url)
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
}

const optionsImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#000000"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-dots mr-1.5"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </svg>
)

const editImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-pencil"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
    <path d="M13.5 6.5l4 4" />
  </svg>
)

const deleteImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-trash"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 7l16 0" />
    <path d="M10 11l0 6" />
    <path d="M14 11l0 6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  </svg>
)
