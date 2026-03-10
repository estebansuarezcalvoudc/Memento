import { beforeEach, describe, expect, it } from 'vitest'

import {
  _getSidebarState,
  _resetSidebarStore,
} from '../../../src/stores/sidebarStore'

describe('sidebarStore', () => {
  beforeEach(() => {
    _resetSidebarStore()
  })

  it('initial state has isSidebarOpen = true', () => {
    expect(_getSidebarState().isSidebarOpen).toBe(true)
  })

  it('toggleSidebar sets isSidebarOpen to false when it was true', () => {
    _getSidebarState().toggleSidebar()
    expect(_getSidebarState().isSidebarOpen).toBe(false)
  })

  it('toggleSidebar sets isSidebarOpen back to true when it was false', () => {
    _getSidebarState().toggleSidebar() // true → false
    _getSidebarState().toggleSidebar() // false → true
    expect(_getSidebarState().isSidebarOpen).toBe(true)
  })

  it('calling toggleSidebar twice returns to the original state', () => {
    _getSidebarState().toggleSidebar()
    _getSidebarState().toggleSidebar()
    expect(_getSidebarState().isSidebarOpen).toBe(true)
  })
})
