import { create } from 'zustand'

export type SetIsUserAuth = (isAuth: boolean) => void

interface AuthStore {
  isUserAuth: boolean
  setIsUserAuth: SetIsUserAuth
  authInitialized: boolean
  setAuthInitialized: (initialized: boolean) => void
}

const useAuthStore = create<AuthStore>()(set => ({
  isUserAuth: false,
  setIsUserAuth: isAuth => set(() => ({ isUserAuth: isAuth })),
  authInitialized: false,
  setAuthInitialized: initialized =>
    set(() => ({ authInitialized: initialized })),
}))

export const useIsUserAuth = () => useAuthStore(state => state.isUserAuth)
export const useSetIsUserAuth = () => useAuthStore(state => state.setIsUserAuth)
export const useIsAuthInitialized = () =>
  useAuthStore(state => state.authInitialized)
export const useSetAuthInitialized = () =>
  useAuthStore(state => state.setAuthInitialized)

export const _resetAuthStore = () =>
  useAuthStore.setState({ isUserAuth: false, authInitialized: false })

export const _getAuthState = () => useAuthStore.getState()

export { useAuthStore as _useAuthStore }
