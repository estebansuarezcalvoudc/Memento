import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SidebarButtons from '../../../src/components/side-bar/navigation/SidebarButtons'
import UploadMeetingsForm from '../../../src/components/upload-meetings/UploadMeetingsForm'
import Meetings from '../../../src/pages/Meetings'
import * as parseFormDataModule from '../../../src/utils/upload-meetings/parseMeetingsFormData'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

function createAudioFile(name = 'recording.mp3') {
  return new File(['audio content'], name, { type: 'audio/mpeg' })
}

// Submit the form by dispatching a native submit event on the first form in the document.
// Searches the whole document to handle forms rendered inside portals.
function submitForm() {
  act(() => {
    document
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

// Spy on parseMeetingsFromFormData to return a valid result (bypasses file validation).
// jsdom's FormData constructor does not reliably read File inputs, so we mock parsing
// for API-response tests and test file validation separately using the real implementation.
function spyValidParsing() {
  const spy = vi
    .spyOn(parseFormDataModule, 'parseMeetingsFromFormData')
    .mockReturnValue({
      ok: true,
      meetingsMetadata: [{ title: 'New Meeting', date: '2024-03-01' }],
      audioFiles: [createAudioFile()],
    })
  return spy
}

describe('Upload Meeting Form', () => {
  it('renders the form with required inputs and a submit button', () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={() => {}} />)

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Date')).toBeInTheDocument()
    expect(screen.getByLabelText('Audio File')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitting with empty fields', async () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={() => {}} />)

    submitForm()

    // Date defaults to today so no "date required" error is expected
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Audio file is required/i)).toBeInTheDocument()
    })
  })

  it('successfully uploads a meeting and calls handleCloseDialog', async () => {
    const spy = spyValidParsing()
    setAuthToken()
    const handleClose = vi.fn()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={handleClose} />)

    submitForm()

    await waitFor(() => expect(handleClose).toHaveBeenCalled(), { timeout: 3000 })
    spy.mockRestore()
  })

  it('shows server error notification when the API fails', async () => {
    const spy = spyValidParsing()
    server.use(
      http.post('/api/meetings', () => new HttpResponse(null, { status: 500 })),
    )
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={() => {}} />)

    submitForm()

    expect(
      await screen.findByText(/Could not upload meetings/i),
    ).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('Upload Meeting Dialog (Sidebar)', () => {
  afterEach(() => vi.restoreAllMocks())

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

    // Mock returns [{ id: 'new-meeting-1', title: 'New Meeting', date: '2024-02-01' }]
    expect(await screen.findByText('New Meeting')).toBeInTheDocument()
  })
})
