import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMeetingListFilters } from '../../../src/hooks/useMeetingListFilters'
import {
  _getMeetingListState,
  _resetMeetingListStore,
} from '../../../src/stores/meetingListStore'
import { type Meeting } from '../../../src/types/meetings'

const MEETINGS: Meeting[] = [
  { id: '1', title: 'Alpha Meeting', date: '2024-01-10' },
  { id: '2', title: 'Beta Session', date: '2024-02-20' },
  { id: '3', title: 'Gamma Call', date: '2024-03-15' },
  { id: '4', title: 'Delta Workshop', date: '2024-04-05' },
  { id: '5', title: 'Epsilon Review', date: '2024-05-01' },
]

beforeEach(() => {
  _resetMeetingListStore()
})

describe('useMeetingListFilters – sorting', () => {
  it('no filters returns all meetings in date-desc order', () => {
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    const titles = result.current.pagedMeetings.map(m => m.title)
    expect(titles).toEqual([
      'Epsilon Review',
      'Delta Workshop',
      'Gamma Call',
      'Beta Session',
      'Alpha Meeting',
    ])
  })

  it('sortOrder title-asc returns meetings alphabetically ascending', () => {
    act(() => {
      _getMeetingListState().setSortOrder('title-asc')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    const titles = result.current.pagedMeetings.map(m => m.title)
    expect(titles).toEqual([
      'Alpha Meeting',
      'Beta Session',
      'Delta Workshop',
      'Epsilon Review',
      'Gamma Call',
    ])
  })
})

describe('useMeetingListFilters – query filtering', () => {
  it('query with exact substring match filters correctly', () => {
    act(() => {
      _getMeetingListState().setQuery('beta')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    expect(result.current.pagedMeetings).toHaveLength(1)
    expect(result.current.pagedMeetings[0].title).toBe('Beta Session')
  })

  it('query with fuzzy match returns matching meetings', () => {
    // "gmm" should fuzzy-match "Gamma Call" (g...m...m... appears in order)
    act(() => {
      _getMeetingListState().setQuery('gmm')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    expect(result.current.pagedMeetings[0].title).toBe('Gamma Call')
  })

  it('query with no match returns empty list', () => {
    act(() => {
      _getMeetingListState().setQuery('zzzznotfound')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    expect(result.current.pagedMeetings).toHaveLength(0)
    expect(result.current.totalCount).toBe(0)
  })
})

describe('useMeetingListFilters – date filtering', () => {
  it('dateFrom excludes meetings with earlier dates', () => {
    act(() => {
      _getMeetingListState().setDateFrom('2024-03-01')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    const titles = result.current.pagedMeetings.map(m => m.title)
    expect(titles).toContain('Gamma Call')
    expect(titles).toContain('Delta Workshop')
    expect(titles).toContain('Epsilon Review')
    expect(titles).not.toContain('Alpha Meeting')
    expect(titles).not.toContain('Beta Session')
  })

  it('dateTo excludes meetings with later dates', () => {
    act(() => {
      _getMeetingListState().setDateTo('2024-02-28')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    const titles = result.current.pagedMeetings.map(m => m.title)
    expect(titles).toContain('Alpha Meeting')
    expect(titles).toContain('Beta Session')
    expect(titles).not.toContain('Gamma Call')
    expect(titles).not.toContain('Delta Workshop')
    expect(titles).not.toContain('Epsilon Review')
  })

  it('dateFrom and dateTo together return only meetings in range', () => {
    act(() => {
      _getMeetingListState().setDateFrom('2024-02-01')
      _getMeetingListState().setDateTo('2024-04-10')
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    const titles = result.current.pagedMeetings.map(m => m.title)
    expect(titles).toHaveLength(3)
    expect(titles).toContain('Beta Session')
    expect(titles).toContain('Gamma Call')
    expect(titles).toContain('Delta Workshop')
  })
})

describe('useMeetingListFilters – pagination', () => {
  it('totalPages is calculated correctly when pageSize is smaller than total', () => {
    act(() => {
      _getMeetingListState().setPageSize(2)
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    // 5 meetings / 2 per page = ceil(2.5) = 3 pages
    expect(result.current.totalPages).toBe(3)
  })

  it('page 2 returns the next slice', () => {
    act(() => {
      _getMeetingListState().setPageSize(2)
      _getMeetingListState().setPage(2)
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    expect(result.current.pagedMeetings).toHaveLength(2)
    // date-desc page 2: Gamma Call, Beta Session
    expect(result.current.pagedMeetings[0].title).toBe('Gamma Call')
    expect(result.current.pagedMeetings[1].title).toBe('Beta Session')
  })

  it('last page contains the remaining items', () => {
    act(() => {
      _getMeetingListState().setPageSize(2)
      _getMeetingListState().setPage(3)
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    expect(result.current.pagedMeetings).toHaveLength(1)
    expect(result.current.pagedMeetings[0].title).toBe('Alpha Meeting')
  })

  it('page > totalPages triggers a reset to page 1 via useEffect', async () => {
    act(() => {
      _getMeetingListState().setPageSize(2)
      _getMeetingListState().setPage(99)
    })
    const { result } = renderHook(() => useMeetingListFilters(MEETINGS))
    // The useEffect fires and calls setPage(1) because page(99) > totalPages(3).
    await waitFor(() => {
      expect(result.current.currentPage).toBe(1)
    })
    expect(_getMeetingListState().page).toBe(1)
  })
})
