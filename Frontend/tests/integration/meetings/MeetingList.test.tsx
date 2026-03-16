import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import Meetings from '../../../src/pages/meetings/Meetings'
import { server } from '../../mocks/server'
import { renderWithRouter, setAuthToken, setupStoreReset } from '../../utils'

setupStoreReset()

async function waitForMeetingsLoaded() {
  return screen.findByText('Team Meeting')
}

// ---------------------------------------------------------------------------
// Search / query
// ---------------------------------------------------------------------------
describe('MeetingList – search', () => {
  it('typing in the search input filters the meeting list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    await user.type(screen.getByPlaceholderText('Search meetings...'), 'sprint')

    expect(screen.getByText('Sprint Planning')).toBeInTheDocument()
    expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument()
  })

  it('clearing the search input restores the full meeting list', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const searchInput = screen.getByPlaceholderText('Search meetings...')
    await user.type(searchInput, 'sprint')
    expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument()

    await user.clear(searchInput)

    expect(await screen.findByText('Team Meeting')).toBeInTheDocument()
    expect(screen.getByText('Sprint Planning')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Sort order
// ---------------------------------------------------------------------------
describe('MeetingList – sort order', () => {
  it('sort select has all four options', async () => {
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const select = screen.getByRole('combobox')
    const options = within(select).getAllByRole('option')
    const labels = options.map(o => o.textContent)

    expect(labels).toContain('Newest first')
    expect(labels).toContain('Oldest first')
    expect(labels).toContain('A → Z')
    expect(labels).toContain('Z → A')
  })

  it('selecting "Oldest first" reorders meetings with Sprint Planning first', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    await user.selectOptions(screen.getByRole('combobox'), 'date-asc')

    const items = screen.getAllByRole('link')
    const titles = items.map(a => a.textContent)
    expect(titles.findIndex(t => t === 'Sprint Planning')).toBeLessThan(
      titles.findIndex(t => t === 'Team Meeting'),
    )
  })

  it('selecting "A → Z" sorts meetings alphabetically ascending', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    await user.selectOptions(screen.getByRole('combobox'), 'title-asc')

    const items = screen.getAllByRole('link')
    const titles = items.map(a => a.textContent)
    expect(titles.findIndex(t => t === 'Sprint Planning')).toBeLessThan(
      titles.findIndex(t => t === 'Team Meeting'),
    )
  })
})

// ---------------------------------------------------------------------------
// Date filter toggle + badge
// ---------------------------------------------------------------------------
describe('MeetingList – date filter toggle', () => {
  it('clicking the toggle shows the date filter panel', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    await user.click(screen.getByRole('button', { name: /filter by date/i }))

    expect(screen.getByLabelText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('clicking the toggle again hides the date filter panel', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    const toggleBtn = screen.getByRole('button', { name: /filter by date/i })
    await user.click(toggleBtn)
    await user.click(toggleBtn)

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
  })

  it('badge (•) appears when a date filter is active and disappears after clearing', async () => {
    const user = userEvent.setup()
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    await user.click(screen.getByRole('button', { name: /filter by date/i }))
    expect(screen.queryByText('•')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('From'), '2024-01-20')
    expect(screen.getByText('•')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByText('•')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Date filters panel
// ---------------------------------------------------------------------------
describe('MeetingList – date filters', () => {
  async function openDateFilters(user: ReturnType<typeof userEvent.setup>) {
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()
    await user.click(screen.getByRole('button', { name: /filter by date/i }))
  }

  it('"From" input filters out meetings before the given date', async () => {
    const user = userEvent.setup()
    await openDateFilters(user)

    await user.type(screen.getByLabelText('From'), '2024-01-16')

    expect(screen.getByText('Team Meeting')).toBeInTheDocument()
    expect(screen.queryByText('Sprint Planning')).not.toBeInTheDocument()
  })

  it('"To" input filters out meetings after the given date', async () => {
    const user = userEvent.setup()
    await openDateFilters(user)

    await user.type(screen.getByLabelText('To'), '2024-01-21')

    expect(screen.getByText('Sprint Planning')).toBeInTheDocument()
    expect(screen.queryByText('Team Meeting')).not.toBeInTheDocument()
  })

  it('clicking "Clear" restores the full meeting list', async () => {
    const user = userEvent.setup()
    await openDateFilters(user)

    await user.type(screen.getByLabelText('From'), '2024-01-16')
    expect(screen.queryByText('Sprint Planning')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(await screen.findByText('Sprint Planning')).toBeInTheDocument()
    expect(screen.getByText('Team Meeting')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

function make16Meetings() {
  return Array.from({ length: 16 }, (_, i) => ({
    id: `m-${i + 1}`,
    title: `Meeting ${String(i + 1).padStart(2, '0')}`,
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
  }))
}

describe('MeetingList – pagination', () => {
  it('pagination is NOT shown when there are 15 or fewer meetings', async () => {
    setAuthToken()
    renderWithRouter(<Meetings />)
    await waitForMeetingsLoaded()

    expect(
      screen.queryByRole('button', { name: 'Prev' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument()
  })

  it('Next/Prev navigate between pages and Prev is disabled on page 1', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/meetings', () => HttpResponse.json(make16Meetings())),
    )

    setAuthToken()
    renderWithRouter(<Meetings />)
    await screen.findByText('Meeting 16')

    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Meeting 01')
    expect(screen.queryByText('Meeting 16')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Prev' }))
    await screen.findByText('Meeting 16')
    expect(screen.queryByText('Meeting 01')).not.toBeInTheDocument()
  })

  it('"Next" is disabled on the last page', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/meetings', () => HttpResponse.json(make16Meetings())),
    )

    setAuthToken()
    renderWithRouter(<Meetings />)
    await screen.findByText('Meeting 16')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Meeting 01')

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
