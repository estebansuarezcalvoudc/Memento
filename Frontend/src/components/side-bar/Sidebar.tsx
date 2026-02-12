import { useRef } from 'react'

import { settingsImage } from '../../assets/buttonsImages'
import { useIsSidebarOpen } from '../../stores/sidebarStore'
import SettingsDialog, {
  type SettingsDialogHandler,
} from '../settings/SettingsDialog'
import ChatsList from './chats-list/ChatsList'
import Header from './header/Header'
import { SidebarButton } from './navigation/SidebarButton'
import SidebarButtons from './navigation/SidebarButtons'

export default function Sidebar() {
  const isSidebarOpen = useIsSidebarOpen()
  const settingsRef = useRef<SettingsDialogHandler>(null)

  return (
    <aside
      className={`fixed flex h-full ${isSidebarOpen ? 'w-64' : 'w-16'} flex-col border-r-1 border-stone-300 bg-stone-100 px-3 text-stone-50 transition-all duration-300 ease-in-out`}
    >
      <Header />
      <SidebarButtons />
      <ChatsList />

      <hr
        className={`my-4 border-t border-stone-400 transition-opacity duration-300 ${isSidebarOpen
            ? 'block opacity-100 delay-150'
            : 'hidden opacity-0 delay-[0ms]'
          }`}
      />

      <SidebarButton
        type="button"
        svg={settingsImage}
        text="Settings"
        onClick={() => settingsRef.current?.open()}
        className="mt-auto mb-2.5"
      />

      <SettingsDialog dialogRef={settingsRef} />
    </aside>
  )
}
