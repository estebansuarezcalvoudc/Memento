import { settingsImage } from '../../assets/buttonsImages'
import { useSideBarStore } from '../../stores/sideBarStore'
import Button from './Button'
import SidebarButtons from './SidebarButtons'
import ChatsList from './chats-list/ChatsList'
import Header from './Header'

export default function SideBar() {
  const isSideBarOpen = useSideBarStore(state => state.isSideBarOpen)

  return (
    <aside
      className={`fixed flex h-full ${isSideBarOpen ? 'w-3xs' : 'w-15'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50 shadow-2xl transition-all duration-300 ease-in-out`}
    >
      <Header />
      <SidebarButtons />
      <ChatsList />

      <hr
        className={`my-4 border-t border-stone-400 transition-opacity duration-300 ${
          isSideBarOpen
            ? 'block opacity-100 delay-150'
            : 'hidden opacity-0 delay-[0ms]'
        }`}
      />

      <Button svg={settingsImage} text="Settings" className="mt-auto mb-2.5" />
    </aside>
  )
}
