import { create } from 'zustand'

interface Store {
  isSideBarOpen: boolean
  toogleSideBar: () => void
}

export const useStore = create<Store>()(set => ({
  isSideBarOpen: true,
  toogleSideBar: () => set(state => ({ isSideBarOpen: !state.isSideBarOpen })),
}))
