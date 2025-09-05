import { create } from 'zustand'

interface SidebarStore {
  isSidebarOpen: boolean
  toogleSidebar: () => void
}

export const useSidebarStore = create<SidebarStore>()(set => ({
  isSidebarOpen: true,
  toogleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
