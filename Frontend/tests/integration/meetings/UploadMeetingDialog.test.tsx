import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import SidebarButtons from '../../../src/components/layout/sidebar/navigation/SidebarButtons'
import Meetings from '../../../src/pages/meetings/Meetings'
import { mockMeetings } from '../../mocks/handlers'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'
import { spyValidParsing, submitForm } from './uploadMeetingHelpers'

setupStoreReset()

describe('Upload Meeting Dialog (Sidebar)', () => {
  it('clicking "Upload Meetings" opens the dialog', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<SidebarButtons />)

    const uploadButton = await screen.findByRole('button', {
      name: /upload meetings/i,
    })
    await user.click(uploadButton)

    expect(document.querySelector('dialog')).toHaveAttribute('open')
  }, 15000)

  it('clicking the close button (×) closes the dialog', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<SidebarButtons />)

    await user.click(
      await screen.findByRole('button', { name: /upload meetings/i }),
    )
    expect(document.querySelector('dialog')).toHaveAttribute('open')

    await user.click(screen.getByRole('button', { name: 'close-dialog' }))
    expect(document.querySelector('dialog')).not.toHaveAttribute('open')
  }, 15000)

  it('pressing Escape closes the dialog', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<SidebarButtons />)

    await user.click(
      await screen.findByRole('button', { name: /upload meetings/i }),
    )
    const dialog = document.querySelector('dialog')
    expect(dialog).toHaveAttribute('open')

    // jsdom does not route keyboard events to <dialog> via userEvent.keyboard,
    // so we dispatch the keydown event directly on the dialog element.
    dialog!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    expect(dialog).not.toHaveAttribute('open')
  }, 15000)

  it('new meeting appears in the meetings list after upload', async () => {
    spyValidParsing()
    setAuthToken()

    const newMeeting = {
      id: 'new-meeting-1',
      title: 'Meeting 1',
      date: '2024-03-01',
    }
    let uploaded = false
    server.use(
      http.post('/api/meetings', () => {
        uploaded = true
        return HttpResponse.json([newMeeting])
      }),
      http.get('/api/meetings', () =>
        HttpResponse.json(
          uploaded ? [...mockMeetings, newMeeting] : mockMeetings,
        ),
      ),
    )

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

    // After upload and cache invalidation, the new meeting appears in the list
    await waitFor(
      () => {
        expect(screen.getByText('Meeting 1')).toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })
})
