import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import TemplateSection from '../../../src/components/settings/sections/summarization/TemplateSection'
import { server } from '../../mocks/server'
import { withAuth } from '../../mocks/withAuth'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

describe('TemplateSection', () => {
  it('shows loading state initially', () => {
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows the current prompt in the textarea after loading', async () => {
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    const textarea = await screen.findByRole('textbox')
    expect(textarea).toHaveValue('You are a helpful assistant. Summarize the meeting.')
  })

  it('Save and Cancel are disabled while no edits have been made', async () => {
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    await screen.findByRole('textbox')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('editing the textarea enables Save and Cancel', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    const textarea = await screen.findByRole('textbox')
    await user.type(textarea, ' Extra text here.')
    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeDisabled()
  })

  it('Cancel resets the textarea to the original value', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    const textarea = await screen.findByRole('textbox')
    const original = textarea.textContent ?? ''
    await user.type(textarea, ' Extra text.')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(textarea).toHaveValue('You are a helpful assistant. Summarize the meeting.')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    void original
  })

  it('shows a validation error when the prompt is too short', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    const textarea = await screen.findByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, 'Too short')
    expect(screen.getByText(/at least 50 characters/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('"Reset to default" sets the textarea to the default prompt', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    await screen.findByRole('textbox')
    await user.click(screen.getByRole('button', { name: 'Reset to default' }))
    expect(screen.getByRole('textbox')).toHaveValue('Default system prompt text here.')
  })

  it('Save calls the PUT endpoint and disables Save/Cancel on success', async () => {
    const user = userEvent.setup()
    let savedPrompt = ''
    server.use(
      http.put('/api/settings/templates/prompt', withAuth(async ({ request }) => {
        const body = await request.json() as { system_prompt: string }
        savedPrompt = body.system_prompt
        return HttpResponse.json({ system_prompt: body.system_prompt })
      })),
    )
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    const textarea = await screen.findByRole('textbox')
    await user.type(textarea, ' Additional details.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(savedPrompt).toBe(
        'You are a helpful assistant. Summarize the meeting. Additional details.',
      ),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled(),
    )
  })

  it('shows an error message when Save fails', async () => {
    const user = userEvent.setup()
    server.use(
      http.put('/api/settings/templates/prompt', withAuth(() =>
        new HttpResponse(null, { status: 500 }),
      )),
    )
    setAuthToken()
    renderWithRouter(<TemplateSection />)
    const textarea = await screen.findByRole('textbox')
    await user.type(textarea, ' Extra text here.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Failed to save. Please try again.')).toBeInTheDocument()
  })
})
