import { create } from 'zustand'

interface SidebarStore {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

const useSidebarStore = create<SidebarStore>()(set => ({
  isSidebarOpen: true,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
}))

export const useIsSidebarOpen = () =>
  useSidebarStore(state => state.isSidebarOpen)

export const useToggleSidebar = () =>
  useSidebarStore(state => state.toggleSidebar)

export const _getSidebarState = () => useSidebarStore.getState()
export const _resetSidebarStore = () =>
  useSidebarStore.setState({ isSidebarOpen: true })
