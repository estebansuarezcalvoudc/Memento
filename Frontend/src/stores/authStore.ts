import { create } from 'zustand'

interface AuthStore {
  isUserAuth: boolean
  setIsUserAuth: (isAuth: boolean) => void
}

const useAuthStore = create<AuthStore>()(set => ({
  isUserAuth: false,
  setIsUserAuth: isAuth => set(() => ({ isUserAuth: isAuth })),
}))

export const useIsUserAuth = () => useAuthStore(state => state.isUserAuth)
export const useSetIsUserAuth = () => useAuthStore(state => state.setIsUserAuth)
