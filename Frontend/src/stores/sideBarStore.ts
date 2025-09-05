import { create } from 'zustand'

interface SideBarStore {
  isSideBarOpen: boolean
  toogleSideBar: () => void
}

export const useSideBarStore = create<SideBarStore>()(set => ({
  isSideBarOpen: true,
  toogleSideBar: () => set(state => ({ isSideBarOpen: !state.isSideBarOpen })),
}))
