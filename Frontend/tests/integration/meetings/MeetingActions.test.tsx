import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import Meetings from '../../../src/pages/meetings/Meetings'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

async function waitForMeetingsLoaded() {
  return screen.findByText('Team Meeting')
}

describe('Meeting Edit', () => {
  it('clicking edit switches to edit mode showing inputs', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])

    expect(await screen.findByDisplayValue('Team Meeting')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('2024-01-22')).toBeInTheDocument()
  })

  it('saving changes updates the meeting title in the list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])

    const titleInput = await screen.findByDisplayValue('Team Meeting')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Meeting')

    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Updated Meeting')).toBeInTheDocument()
  })

  it('cancelling edit restores the original title', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])

    const titleInput = await screen.findByDisplayValue('Team Meeting')
    await user.clear(titleInput)
    await user.type(titleInput, 'Changed Title')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument()
  })

  it('changing the date and saving calls the API with the updated date', async () => {
    const user = userEvent.setup()
    let patchedUpdates: Record<string, unknown> | null = null
    const { server } = await import('../../mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.patch('/api/meetings/:id', async ({ request }) => {
        patchedUpdates = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])

    const dateInput = await screen.findByDisplayValue('2024-01-22')
    await user.clear(dateInput)
    await user.type(dateInput, '2024-06-01')

    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(patchedUpdates).toEqual({ date: '2024-06-01' }))
  })

  it('confirming without changes closes edit mode without calling the API', async () => {
    const user = userEvent.setup()
    let patchCalled = false
    const { server } = await import('../../mocks/server')
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.patch('/api/meetings/:id', () => {
        patchCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])

    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(screen.queryByDisplayValue('Team Meeting')).not.toBeInTheDocument()
    expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    expect(patchCalled).toBe(false)
  })
})

describe('Meeting Delete', () => {
  it('deletes a meeting and removes it from the list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])

    const deleteDialog = await screen.findByRole('dialog')
    await user.click(
      within(deleteDialog).getByRole('button', { name: 'Delete' }),
    )

    await waitFor(() => {
      expect(
        screen.queryByRole('link', { name: 'Team Meeting' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText('Sprint Planning')).toBeInTheDocument()
  })
})
