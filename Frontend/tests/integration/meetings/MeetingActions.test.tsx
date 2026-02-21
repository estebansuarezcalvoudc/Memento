import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import Meetings from '../../../src/pages/meetings/Meetings'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

// The edit and delete buttons in MeetingItem are rendered as SVG icon buttons.
// We find them by their position relative to the meeting row.
async function waitForMeetingsLoaded() {
  return screen.findByText('Team Meeting')
}

describe('Meeting Edit', () => {
  it('clicking edit switches to edit mode showing inputs', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    // There are two edit buttons (one per meeting); click the first one
    const editButtons = screen.getAllByRole('button')
    // Edit buttons come before delete buttons in the row: indices 0, 2 are edit; 1, 3 are delete
    await user.click(editButtons[0])

    // In edit mode, text inputs appear for title and date
    expect(screen.getByDisplayValue('Team Meeting')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
  })

  it('saving changes updates the meeting title in the list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button')
    await user.click(editButtons[0])

    const titleInput = screen.getByDisplayValue('Team Meeting')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Meeting')

    // Click confirm (first button after entering edit mode)
    const confirmButton = screen.getAllByRole('button')[0]
    await user.click(confirmButton)

    expect(await screen.findByText('Updated Meeting')).toBeInTheDocument()
  })

  it('cancelling edit restores the original title', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const editButtons = screen.getAllByRole('button')
    await user.click(editButtons[0])

    const titleInput = screen.getByDisplayValue('Team Meeting')
    await user.clear(titleInput)
    await user.type(titleInput, 'Changed Title')

    // Click cancel (second button in edit mode)
    const cancelButton = screen.getAllByRole('button')[1]
    await user.click(cancelButton)

    expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Changed Title')).not.toBeInTheDocument()
  })
})

describe('Meeting Delete', () => {
  it('deletes a meeting and removes it from the list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    // Delete buttons are the second button in each row: indices 1, 3
    const deleteButton = screen.getAllByRole('button')[1]
    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument()
    })
    // The other meeting should still be there
    expect(screen.getByText('Sprint Planning')).toBeInTheDocument()
  })
})
