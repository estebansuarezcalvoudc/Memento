import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import GeneralView from '../../../src/components/settings/sections/general/GeneralView'
import { renderWithRouter, setupStoreReset } from '../../utils'

setupStoreReset()

// matchMedia is not implemented in jsdom – stub it so themeStore can work
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

describe('GeneralView', () => {
  it('renders the Theme select', () => {
    renderWithRouter(<GeneralView />)
    expect(screen.getByLabelText('Theme')).toBeInTheDocument()
  })

  it('shows all theme options', () => {
    renderWithRouter(<GeneralView />)
    expect(screen.getByRole('option', { name: 'System' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Light' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument()
  })

  it('renders the Language select', () => {
    renderWithRouter(<GeneralView />)
    expect(screen.getByLabelText('Language')).toBeInTheDocument()
  })

  it('shows all language options', () => {
    renderWithRouter(<GeneralView />)
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Spanish' })).toBeInTheDocument()
  })

  it('changing the theme select to "dark" adds the dark class to <html>', async () => {
    const user = userEvent.setup()
    renderWithRouter(<GeneralView />)

    await user.selectOptions(screen.getByLabelText('Theme'), 'dark')

    expect(screen.getByLabelText('Theme')).toHaveValue('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
