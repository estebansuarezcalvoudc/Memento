import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'

import SidebarButton from '../SidebarButton'
import ChatOptionsButton from './ChatOptionButton'

interface ChatOptionsProps {
  onMenuStateChange: (isOpen: boolean) => void
}

export default function ChatOptionsDropdown({
  onMenuStateChange,
}: ChatOptionsProps) {
  return (
    <Menu>
      {({ open }) => {
        onMenuStateChange(open)

        return (
          <div>
            <MenuButton className="inline-flex cursor-pointer items-center justify-center rounded-md p-2">
              {optionsImage}
            </MenuButton>

            <MenuItems
              portal
              transition
              anchor="bottom end"
              className="rounded-md bg-white shadow-lg outline-1 outline-stone-300 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <MenuItem>
                <ChatOptionsButton svg={editImage} text="Rename" />
              </MenuItem>
              <MenuItem>
                <ChatOptionsButton
                  svg={deleteImage}
                  text="Delete"
                  textColor="text-red-500"
                  hoverColor="hover:bg-red-50"
                />
              </MenuItem>
            </MenuItems>
          </div>
        )
      }}
    </Menu>
  )
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
