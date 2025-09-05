import { useSidebarStore } from '../../../stores/sidebarStore'
import ChatButton from './ChatButton'

const conversations = [
  'Unnamed conversation',
  'Unnamed conversation 2',
  'Unnamed conversation 3',
  'Unnamed conversation 4',
  'Unnamed conversation 2',
  'Unnamed conversation 3',
  'Unnamed conversation 4',
  'Unnamed conversation 2',
  'Unnamed conversation 3',
  'Unnamed conversation 4',
  'Unnamed conversation 2',
  'Unnamed conversation 3',
  'Unnamed conversation 4',
  'Unnamed conversation 2',
  'Unnamed conversation 3',
  'Unnamed conversation 4',
  'Unnamed conversation 2',
  'Unnamed conversation 3',
  'Unnamed conversation 4',
]

export default function ChatsList() {
  const isSidebarOpen = useSidebarStore(state => state.isSidebarOpen)

  return (
    <div
      className={`min-h-0 flex-1 transition-opacity duration-300 ${
        isSidebarOpen
          ? 'block opacity-100 delay-150'
          : 'hidden opacity-0 delay-[0ms]'
      } flex h-full flex-col overflow-hidden`}
    >
      <h2 className="font-ubuntu mt-8 mb-2 ml-1.5 flex-shrink-0 truncate text-sm text-stone-400">
        Chats
      </h2>
      <ul className="custom-scrollbar flex-1 overflow-y-auto">
        {conversations.map((title, index) => (
          <li key={index}>
            <ChatButton chatTitle={title} />
          </li>
        ))}
      </ul>
    </div>
  )
}
