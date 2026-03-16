import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { settingsImage } from '../../../assets/buttonsImages'
import {
  useIsSidebarOpen,
  useSetSidebarOpen,
} from '../../../stores/sidebarStore'
import SettingsDialog from '../../settings/SettingsDialog'
import type { DialogHandler } from '../../ui/layout/Dialog'
import ChatsList from './chats-list/ChatsList'
import Header from './header/Header'
import { SidebarButton } from './navigation/SidebarButton'
import SidebarButtons from './navigation/SidebarButtons'

export default function Sidebar() {
  const { t } = useTranslation()
  const isSidebarOpen = useIsSidebarOpen()
  const setSidebarOpen = useSetSidebarOpen()

  const dialogRef = useRef<DialogHandler>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 800px)')

    const collapseIfNarrow = (matches: boolean) => {
      if (matches) {
        setSidebarOpen(false)
      }
    }

    collapseIfNarrow(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      collapseIfNarrow(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [setSidebarOpen])

  return (
    <aside
      className={`fixed flex h-full ${isSidebarOpen ? 'w-64' : 'w-[54px]'} flex-col border-r-1 border-stone-300 bg-stone-100 px-2 text-stone-50 transition-all duration-300 ease-in-out dark:border-stone-700 dark:bg-stone-900`}
    >
      <Header />
      <SidebarButtons />
      <ChatsList />

      <hr
        className={`my-4 border-t border-stone-400 transition-opacity duration-300 dark:border-stone-600 ${
          isSidebarOpen
            ? 'block opacity-100 delay-150'
            : 'hidden opacity-0 delay-[0ms]'
        }`}
      />

      <SidebarButton
        type="button"
        svg={settingsImage}
        text={t('sidebar.settings')}
        onClick={() => dialogRef.current?.open()}
        className="mt-auto mb-2.5"
      />

      <SettingsDialog dialogRef={dialogRef} />
    </aside>
  )
}
