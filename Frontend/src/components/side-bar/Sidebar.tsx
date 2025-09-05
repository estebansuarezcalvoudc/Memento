import { settingsImage } from '../../assets/buttonsImages'
import { useSidebarStore } from '../../stores/sidebarStore'
import Button from './Button'
import ChatsList from './chats-list/ChatsList'
import Header from './Header'
import SidebarButtons from './SidebarButtons'

export default function Sidebar() {
  const isSidebarOpen = useSidebarStore(state => state.isSidebarOpen)

  return (
    <aside
      className={`fixed flex h-full ${isSidebarOpen ? 'w-3xs' : 'w-15'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50 shadow-2xl transition-all duration-300 ease-in-out`}
    >
      <Header />
      <SidebarButtons />
      <ChatsList />

      <hr
        className={`my-4 border-t border-stone-400 transition-opacity duration-300 ${
          isSidebarOpen
            ? 'block opacity-100 delay-150'
            : 'hidden opacity-0 delay-[0ms]'
        }`}
      />

      <Button svg={settingsImage} text="Settings" className="mt-auto mb-2.5" />
    </aside>
  )
}
