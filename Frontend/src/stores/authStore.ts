import { create } from 'zustand'

export type SetIsUserAuth = (isAuth: boolean) => void

interface AuthStore {
  isUserAuth: boolean
  setIsUserAuth: SetIsUserAuth
}

const useAuthStore = create<AuthStore>()(set => ({
  isUserAuth: false,
  setIsUserAuth: isAuth => set(() => ({ isUserAuth: isAuth })),
}))

export const useIsUserAuth = () => useAuthStore(state => state.isUserAuth)
export const useSetIsUserAuth = () => useAuthStore(state => state.setIsUserAuth)

export const _resetAuthStore = () => useAuthStore.setState({ isUserAuth: false })
