import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import * as parseFormDataModule from '../../../src/components/meetings/upload/parseMeetingsFormData'
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

describe('MeetingForm – optional inputs toggle', () => {
  it('optional inputs (language, speakers) are hidden by default', () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    expect(
      screen.queryByLabelText('Meeting 1 language'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Meeting 1 number of speakers'),
    ).not.toBeInTheDocument()
  })

  it('toggle button starts with aria-expanded="false"', () => {
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'toggle options' }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking the toggle reveals the language and speakers inputs', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'toggle options' }))

    expect(screen.getByLabelText('Meeting 1 language')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Meeting 1 number of speakers'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'toggle options' }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking the toggle a second time hides the optional inputs again', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    const toggleBtn = screen.getByRole('button', { name: 'toggle options' })
    await user.click(toggleBtn)
    await user.click(toggleBtn)

    expect(
      screen.queryByLabelText('Meeting 1 language'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Meeting 1 number of speakers'),
    ).not.toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('language select shows the options returned by the API', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'toggle options' }))

    const languageSelect = screen.getByLabelText('Meeting 1 language')
    expect(
      Array.from(languageSelect.querySelectorAll('option')).map(
        o => o.textContent,
      ),
    ).toEqual(['Any', 'English', 'Spanish'])
  })

  it('each meeting row has its own independent toggle', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /\+ add meeting/i }))

    const toggleBtns = screen.getAllByRole('button', { name: 'toggle options' })
    expect(toggleBtns).toHaveLength(2)

    // Expand only the second meeting's toggle
    await user.click(toggleBtns[1])

    expect(screen.getByLabelText('Meeting 2 language')).toBeInTheDocument()
    expect(
      screen.queryByLabelText('Meeting 1 language'),
    ).not.toBeInTheDocument()
  })

  it('selected language is submitted in the form data', async () => {
    const user = userEvent.setup()
    setAuthToken()

    let capturedFormData: FormData | undefined
    vi.spyOn(
      parseFormDataModule,
      'parseMeetingsFromFormData',
    ).mockImplementation((fd: FormData) => {
      capturedFormData = fd
      // Return a valid parse result so the form proceeds past validation
      return {
        ok: true,
        meetingsMetadata: [
          { title: 'Test', date: '2024-01-01', language: 'en' },
        ],
        audioFiles: [
          new File(['audio'], 'recording.mp3', { type: 'audio/mpeg' }),
        ],
      }
    })

    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    // Expand options and select English
    await user.click(screen.getByRole('button', { name: 'toggle options' }))
    await user.selectOptions(screen.getByLabelText('Meeting 1 language'), 'en')

    submitForm()

    await waitFor(() => expect(capturedFormData).toBeDefined())
    expect(capturedFormData!.get('meetings[0][language]')).toBe('en')
  })

  it('speakers value is submitted in the form data', async () => {
    const user = userEvent.setup()
    setAuthToken()

    let capturedFormData: FormData | undefined
    vi.spyOn(
      parseFormDataModule,
      'parseMeetingsFromFormData',
    ).mockImplementation((fd: FormData) => {
      capturedFormData = fd
      return {
        ok: true,
        meetingsMetadata: [
          { title: 'Test', date: '2024-01-01', number_of_speakers: 3 },
        ],
        audioFiles: [
          new File(['audio'], 'recording.mp3', { type: 'audio/mpeg' }),
        ],
      }
    })

    renderWithRouter(<UploadMeetingsForm handleCloseDialog={vi.fn()} />)

    // Expand options and type a speakers value
    await user.click(screen.getByRole('button', { name: 'toggle options' }))
    await user.type(screen.getByLabelText('Meeting 1 number of speakers'), '3')

    submitForm()

    await waitFor(() => expect(capturedFormData).toBeDefined())
    expect(capturedFormData!.get('meetings[0][speakers]')).toBe('3')
  })
})
