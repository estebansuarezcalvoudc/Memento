import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  _getThemeState,
  _resetThemeStore,
} from '../../../src/stores/themeStore'

// matchMedia is not implemented in jsdom – we must stub it before any call
// to applyTheme (which runs via _resetThemeStore inside beforeEach).
function stubMatchMedia(matches = false) {
  const addEventListenerSpy = vi.fn()
  const removeEventListenerSpy = vi.fn()
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: addEventListenerSpy,
      removeEventListener: removeEventListenerSpy,
    }),
  )
  return { addEventListenerSpy, removeEventListenerSpy }
}

describe('themeStore – applyTheme', () => {
  beforeEach(() => {
    // Stub matchMedia FIRST, then reset the store (which calls applyTheme internally)
    stubMatchMedia(false)
    document.documentElement.classList.remove('dark')
    _resetThemeStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('setTheme("dark") adds the "dark" class to <html>', () => {
    _getThemeState().setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme("light") removes the "dark" class from <html>', () => {
    document.documentElement.classList.add('dark')
    _getThemeState().setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme("system") adds "dark" when system prefers dark', () => {
    stubMatchMedia(true) // override: system is dark
    _getThemeState().setTheme('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme("system") removes "dark" when system prefers light', () => {
    document.documentElement.classList.add('dark')
    // stubMatchMedia(false) is already in place from beforeEach
    _getThemeState().setTheme('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme("system") subscribes to media query changes', () => {
    const { addEventListenerSpy } = stubMatchMedia(false)
    _getThemeState().setTheme('system')
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })

  it('switching away from "system" removes the previous listener', () => {
    const { removeEventListenerSpy } = stubMatchMedia(false)
    _getThemeState().setTheme('system') // installs listener
    _getThemeState().setTheme('dark') // should remove it
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })

  it('the system media query listener adds "dark" on a change event with matches=true', () => {
    let capturedListener: ((e: MediaQueryListEvent) => void) | null = null
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => {
          capturedListener = fn
        },
        removeEventListener: vi.fn(),
      }),
    )
    _getThemeState().setTheme('system')
    expect(capturedListener).not.toBeNull()
    capturedListener!({ matches: true } as MediaQueryListEvent)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('the system media query listener removes "dark" on a change event with matches=false', () => {
    document.documentElement.classList.add('dark')
    let capturedListener: ((e: MediaQueryListEvent) => void) | null = null
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => {
          capturedListener = fn
        },
        removeEventListener: vi.fn(),
      }),
    )
    _getThemeState().setTheme('system')
    capturedListener!({ matches: false } as MediaQueryListEvent)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('themeStore – state management', () => {
  beforeEach(() => {
    stubMatchMedia(false)
    document.documentElement.classList.remove('dark')
    _resetThemeStore()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initial theme is "system"', () => {
    expect(_getThemeState().theme).toBe('system')
  })

  it('setTheme updates the stored theme value', () => {
    _getThemeState().setTheme('dark')
    expect(_getThemeState().theme).toBe('dark')
  })

  it('_resetThemeStore resets theme to "system"', () => {
    _getThemeState().setTheme('dark')
    _resetThemeStore()
    expect(_getThemeState().theme).toBe('system')
  })

  it('_getThemeState returns the current state object', () => {
    _getThemeState().setTheme('light')
    const state = _getThemeState()
    expect(state.theme).toBe('light')
    expect(typeof state.setTheme).toBe('function')
  })
})
