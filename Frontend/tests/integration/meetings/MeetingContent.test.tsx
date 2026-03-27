import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import MeetingContent from '../../../src/pages/meetings/MeetingContent'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

function renderTranscription() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/meetings/:meetingId/transcription"
        element={<MeetingContent type="transcription" />}
      />
      <Route
        path="/meetings/:meetingId/summary"
        element={<MeetingContent type="summary" />}
      />
    </Routes>,
    { route: '/meetings/meeting-1/transcription' },
  )
}

function renderSummary() {
  return renderWithRouter(
    <Routes>
      <Route
        path="/meetings/:meetingId/transcription"
        element={<MeetingContent type="transcription" />}
      />
      <Route
        path="/meetings/:meetingId/summary"
        element={<MeetingContent type="summary" />}
      />
    </Routes>,
    { route: '/meetings/meeting-1/summary' },
  )
}

describe('MeetingContent Page', () => {
  it('shows loading state initially for transcription', () => {
    setAuthToken()
    renderTranscription()

    expect(screen.getByText('Loading transcription')).toBeInTheDocument()
  })

  it('shows the transcription content after loading', async () => {
    setAuthToken()
    renderTranscription()

    expect(
      await screen.findByText('Speaker 1: Hello everyone'),
    ).toBeInTheDocument()
  })

  it('shows the meeting title and date after loading', async () => {
    setAuthToken()
    renderTranscription()

    expect(await screen.findByText(/Team Meeting/)).toBeInTheDocument()
    expect(screen.getByText(/01\/22\/2024/)).toBeInTheDocument()
  })

  it('shows loading state initially for summary', () => {
    setAuthToken()
    renderSummary()

    expect(screen.getByText('Loading Summary')).toBeInTheDocument()
  })

  it('shows the summary content after loading', async () => {
    setAuthToken()
    renderSummary()

    // "## Summary\nContent here" rendered by react-markdown
    // Wait for "Content here" which only appears after the API responds
    expect(await screen.findByText('Content here')).toBeInTheDocument()
  })

  it('shows error message when transcription API fails', async () => {
    server.use(
      http.get(
        '/api/meetings/transcription/:id',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    setAuthToken()
    renderTranscription()

    expect(
      await screen.findByText(/Failed to fetch transcription/i),
    ).toBeInTheDocument()
  })

  it('has a link to navigate to the summary view', async () => {
    setAuthToken()
    renderTranscription()

    await screen.findByText('Speaker 1: Hello everyone')

    const summaryLink = screen.getByRole('link', { name: 'Summary' })
    expect(summaryLink).toHaveAttribute('href', '/meetings/meeting-1/summary')
  })

  it('navigating from transcription to summary loads the summary', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderTranscription()

    await screen.findByText('Speaker 1: Hello everyone')

    await user.click(screen.getByRole('link', { name: 'Summary' }))

    expect(await screen.findByText('Content here')).toBeInTheDocument()
  })
})
