import { create } from 'zustand'

interface SidebarStore {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export const useSidebarStore = create<SidebarStore>()(set => ({
  isSidebarOpen: true,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
