import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import UploadMeetingsForm from '../../../src/components/meetings/upload/UploadMeetingsForm'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'
import {
  meetingsPostHandler,
  spyValidParsing,
  submitForm,
} from './uploadMeetingHelpers'

setupStoreReset()

describe('Upload Meeting Form', () => {
  it('renders the form with required inputs and a submit button', () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    expect(screen.getByLabelText('Meeting 1 title')).toBeInTheDocument()
    expect(screen.getByLabelText('Meeting 1 date')).toBeInTheDocument()
    expect(screen.getByLabelText('Meeting 1 audio file')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitting with empty fields', async () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    // Date defaults to today so no "date required" error is expected
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Audio file is required/i)).toBeInTheDocument()
    })
  })

  it('successfully uploads a meeting and calls handleCloseDialog', async () => {
    spyValidParsing()
    setAuthToken()
    const handleClose = vi.fn()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={handleClose} />)

    submitForm()

    await waitFor(() => expect(handleClose).toHaveBeenCalled(), {
      timeout: 3000,
    })
  })

  it('clears the form fields after a successful upload', async () => {
    spyValidParsing()
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.type(screen.getByLabelText('Meeting 1 title'), 'My Test Meeting')
    expect(screen.getByLabelText('Meeting 1 title')).toHaveValue(
      'My Test Meeting',
    )

    submitForm()

    await screen.findByText('1 meeting has been uploaded')

    // A new MeetingForm is mounted with an empty title after reset
    expect(screen.getByLabelText('Meeting 1 title')).toHaveValue('')
  })

  it('resets to a single empty entry after uploading multiple meetings', async () => {
    spyValidParsing(2)
    server.use(meetingsPostHandler(2))
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /\+ add meeting/i }))
    expect(screen.getAllByLabelText(/Meeting \d+ title/)).toHaveLength(2)

    submitForm()

    await screen.findByText('2 meetings have been uploaded')

    expect(screen.getAllByLabelText(/Meeting \d+ title/)).toHaveLength(1)
    expect(screen.getByLabelText('Meeting 1 title')).toHaveValue('')
  })
})
