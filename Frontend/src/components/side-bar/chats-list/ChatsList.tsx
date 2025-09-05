import { useSidebarStore } from '../../../stores/sidebarStore'
import ChatButton from './ChatButton'

// Define the conversation type to match your backend schema
interface Conversation {
  id: string
  title: string
  started_at?: string // ISO date string
}

const conversations: Conversation[] = [
  { id: 'conv_1', title: 'Unnamed conversation' },
  { id: 'conv_2', title: 'Unnamed conversation 2' },
  { id: 'conv_3', title: 'Unnamed conversation 3' },
  { id: 'conv_4', title: 'Unnamed conversation 4' },
  { id: 'conv_5', title: 'Unnamed conversation 2' },
  { id: 'conv_6', title: 'Unnamed conversation 3' },
  { id: 'conv_7', title: 'Unnamed conversation 4' },
  { id: 'conv_8', title: 'Unnamed conversation 2' },
  { id: 'conv_9', title: 'Unnamed conversation 3' },
  { id: 'conv_10', title: 'Unnamed conversation 4' },
  { id: 'conv_11', title: 'Unnamed conversation 2' },
  { id: 'conv_12', title: 'Unnamed conversation 3' },
  { id: 'conv_13', title: 'Unnamed conversation 4' },
  { id: 'conv_14', title: 'Unnamed conversation 2' },
  { id: 'conv_15', title: 'Unnamed conversation 3' },
  { id: 'conv_16', title: 'Unnamed conversation 4' },
  { id: 'conv_17', title: 'Unnamed conversation 2' },
  { id: 'conv_18', title: 'Unnamed conversation 3' },
  { id: 'conv_19', title: 'Unnamed conversation 4' },
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
        {conversations.map(conversation => (
          <li key={conversation.id}>
            <ChatButton chatTitle={conversation.title} />
          </li>
        ))}
      </ul>
    </div>
  )
}
