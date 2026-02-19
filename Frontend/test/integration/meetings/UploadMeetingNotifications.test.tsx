import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SuccessNotification from '../../../src/components/upload-meetings/notifications/SuccessNotification'
import UploadMeetingsForm from '../../../src/components/upload-meetings/UploadMeetingsForm'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'
import {
  meetingsPostHandler,
  spyValidParsing,
  submitForm,
} from './uploadMeetingHelpers'

setupStoreReset()

describe('Upload Meeting Notifications', () => {
  // Restore real timers after each test in case a test installs fake ones
  afterEach(() => vi.useRealTimers())

  it('shows "Uploading 1 meeting" notification while the upload is in progress', () => {
    spyValidParsing()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    // isPending becomes true synchronously inside act(), so the notification
    // is already rendered when submitForm() returns
    expect(screen.getByText('Uploading 1 meeting')).toBeInTheDocument()
  })

  it('shows "Uploading N meetings" when N meetings are queued', async () => {
    spyValidParsing(3)
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /\+ add meeting/i }))
    await user.click(screen.getByRole('button', { name: /\+ add meeting/i }))

    submitForm()

    expect(screen.getByText('Uploading 3 meetings')).toBeInTheDocument()
  })

  it('transitions from "Uploading" to "1 meeting has been uploaded" on success', async () => {
    spyValidParsing()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    expect(screen.getByText('Uploading 1 meeting')).toBeInTheDocument()

    await screen.findByText('1 meeting has been uploaded')

    expect(screen.queryByText('Uploading 1 meeting')).not.toBeInTheDocument()
  })

  it('transitions from "Uploading" to "N meetings have been uploaded" on success', async () => {
    spyValidParsing(3)
    server.use(meetingsPostHandler(3))
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /\+ add meeting/i }))
    await user.click(screen.getByRole('button', { name: /\+ add meeting/i }))

    submitForm()

    expect(screen.getByText('Uploading 3 meetings')).toBeInTheDocument()

    await screen.findByText('3 meetings have been uploaded')

    expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument()
  })

  it('only one notification is visible at a time after success', async () => {
    spyValidParsing()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    await screen.findByText('1 meeting has been uploaded')

    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('success notification can be closed with the close button', async () => {
    spyValidParsing()
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    await screen.findByText('1 meeting has been uploaded')

    await user.click(screen.getByRole('button', { name: /close notification/i }))

    expect(screen.queryByText('1 meeting has been uploaded')).not.toBeInTheDocument()
  })

  it('success notification auto-dismisses after 6 seconds', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    // Render the notification component directly; renderWithRouter ensures the
    // #notification portal div exists
    renderWithRouter(<SuccessNotification numberOfMeetings={2} onClose={onClose} />)

    expect(screen.getByText('2 meetings have been uploaded')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    vi.advanceTimersByTime(6001)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('uploading notification can be closed before the upload finishes', async () => {
    spyValidParsing()
    server.use(meetingsPostHandler(1, 150))
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    expect(screen.getByText('Uploading 1 meeting')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close notification/i }))

    expect(screen.queryByText('Uploading 1 meeting')).not.toBeInTheDocument()

    // Let the upload finish to avoid act() warnings from pending state updates
    await screen.findByText('1 meeting has been uploaded')
  })

  it('success notification still appears after the uploading notification was closed', async () => {
    spyValidParsing()
    server.use(meetingsPostHandler(1, 100))
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    await user.click(screen.getByRole('button', { name: /close notification/i }))

    expect(screen.queryByText('Uploading 1 meeting')).not.toBeInTheDocument()

    // Upload completes → success notification must still appear
    await screen.findByText('1 meeting has been uploaded')
  })

  it('transitions from "Uploading" to error notification on API failure', async () => {
    spyValidParsing()
    server.use(http.post('/api/meetings', () => new HttpResponse(null, { status: 500 })))
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    expect(screen.getByText('Uploading 1 meeting')).toBeInTheDocument()

    await screen.findByText(/Could not upload meetings/i)

    expect(screen.queryByText('Uploading 1 meeting')).not.toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('server error notification can be closed', async () => {
    spyValidParsing()
    server.use(http.post('/api/meetings', () => new HttpResponse(null, { status: 500 })))
    setAuthToken()
    const user = userEvent.setup()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    await screen.findByText(/Could not upload meetings/i)

    await user.click(screen.getByRole('button', { name: /close notification/i }))

    expect(screen.queryByText(/Could not upload meetings/i)).not.toBeInTheDocument()
  })

  it('does not show any notification when form has validation errors', async () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    submitForm()

    await waitFor(() =>
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument(),
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
