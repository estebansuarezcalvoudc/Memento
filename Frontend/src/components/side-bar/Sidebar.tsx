import { settingsImage } from '../../assets/buttonsImages'
import { useIsSidebarOpen } from '../../stores/sidebarStore'
import ChatsList from './chats-list/ChatsList'
import Header from './header/Header'
import SidebarButtons from './navigation/SidebarButtons'
import { SidebarButton } from './navigation/SidebarButton'

export default function Sidebar() {
  const isSidebarOpen = useIsSidebarOpen()

  return (
    <aside
      className={`fixed flex h-full ${isSidebarOpen ? 'w-64' : 'w-16'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50 shadow-2xl transition-all duration-300 ease-in-out`}
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

      <SidebarButton
        type='button'
        svg={settingsImage}
        text="Settings"
        onClick={() => console.log('Settings clicked')}
        className="mb-2.5"
      />
    </aside>
  )
}
