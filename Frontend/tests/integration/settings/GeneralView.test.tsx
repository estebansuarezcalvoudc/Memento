import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GeneralView from '../../../src/components/settings/sections/general/GeneralView'
import { renderWithRouter, setupStoreReset } from '../../utils'

setupStoreReset()

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
})
