import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'system' | 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Listener de cambios del sistema, guardado para poder eliminarlo si cambia la preferencia del usuario
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null

// Instancia estable de MediaQueryList para evitar fugas de listeners al reutilizar la misma referencia
let stableMediaQuery: MediaQueryList | null = null

function getStableMediaQuery(): MediaQueryList | null {
  // Guard for SSR/non-browser environments and older browsers without matchMedia support
  if (typeof window === 'undefined' || !('matchMedia' in window)) {
    return null
  }
  if (!stableMediaQuery) {
    stableMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  }
  return stableMediaQuery
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const mediaQuery = getStableMediaQuery()

  // Elimina el listener anterior si lo hubiera
  if (systemThemeListener && mediaQuery) {
    mediaQuery.removeEventListener('change', systemThemeListener)
    systemThemeListener = null
  }

  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // 'system': aplica el tema actual del sistema y suscribe a cambios futuros
    if (mediaQuery) {
      if (mediaQuery.matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      systemThemeListener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
      mediaQuery.addEventListener('change', systemThemeListener)
    }
  }
}

const useThemeStore = create<ThemeStore>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    {
      name: 'theme-storage',
      // Solo persiste el campo 'theme', no las funciones
      partialize: state => ({ theme: state.theme }),
      // Al rehidratar desde localStorage, aplica el tema guardado en el DOM
      onRehydrateStorage: () => state => {
        if (state) {
          applyTheme(state.theme)
        }
      },
    },
  ),
)

export const useTheme = () => useThemeStore(state => state.theme)
export const useSetTheme = () => useThemeStore(state => state.setTheme)

export const _resetThemeStore = () => {
  applyTheme('system')
  useThemeStore.setState({ theme: 'system' })
}

export const _getThemeState = () => useThemeStore.getState()
