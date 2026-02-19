import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import SidebarButtons from '../../../src/components/side-bar/navigation/SidebarButtons'
import Meetings from '../../../src/pages/Meetings'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'
import { spyValidParsing, submitForm } from './uploadMeetingHelpers'

setupStoreReset()

describe('Upload Meeting Dialog (Sidebar)', () => {
  it('clicking "Upload Meetings" opens the dialog', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<SidebarButtons />)

    // useDelayedDisplay hides the label for 150ms; findByRole waits for it
    const uploadButton = await screen.findByRole('button', {
      name: /upload meetings/i,
    })
    await user.click(uploadButton)

    expect(document.querySelector('dialog')).toHaveAttribute('open')
  })

  it('new meeting appears in the meetings list after upload', async () => {
    spyValidParsing()
    setAuthToken()
    renderWithRouter(
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SidebarButtons />
              <Meetings />
            </>
          }
        />
      </Routes>,
    )

    await screen.findByText('Team Meeting')

    const uploadButton = await screen.findByRole('button', {
      name: /upload meetings/i,
    })
    await userEvent.click(uploadButton)

    // The form is inside the dialog portal (#upload-meetings-modal)
    submitForm()

    // Mock returns [{ id: 'new-meeting-1', title: 'Meeting 1', date: '2024-03-01' }]
    expect(await screen.findByText('Meeting 1')).toBeInTheDocument()
  })
})
