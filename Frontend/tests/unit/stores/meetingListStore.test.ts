import { beforeEach, describe, expect, it } from 'vitest'

import {
  _getMeetingListState,
  _resetMeetingListStore,
} from '../../../src/stores/meetingListStore'

describe('meetingListStore', () => {
  beforeEach(() => {
    _resetMeetingListStore()
  })

  it('initial state has expected values', () => {
    const s = _getMeetingListState()
    expect(s.query).toBe('')
    expect(s.sortOrder).toBe('date-desc')
  })

  it('setQuery updates query', () => {
    _getMeetingListState().setQuery('hello')
    expect(_getMeetingListState().query).toBe('hello')
  })

  it('setSortOrder updates sortOrder', () => {
    _getMeetingListState().setSortOrder('title-asc')
    expect(_getMeetingListState().sortOrder).toBe('title-asc')
  })

  it('toggleDateFilters sets showDateFilters to true when false', () => {
    _getMeetingListState().toggleDateFilters()
    expect(_getMeetingListState().showDateFilters).toBe(true)
  })

  it('clearDates resets both dates at once', () => {
    _getMeetingListState().setDateFrom('2024-01-01')
    _getMeetingListState().setDateTo('2024-12-31')
    _getMeetingListState().clearDates()
    expect(_getMeetingListState().dateFrom).toBe('')
    expect(_getMeetingListState().dateTo).toBe('')
  })

  it('_resetMeetingListStore resets all fields to initial values', () => {
    const s = _getMeetingListState()
    s.setQuery('test')
    s.setDateFrom('2024-01-01')
    s.setDateTo('2024-12-31')
    s.setSortOrder('title-desc')
    s.toggleDateFilters()
    s.setPage(5)
    s.setPageSize(30)

    _resetMeetingListStore()

    const reset = _getMeetingListState()
    expect(reset.query).toBe('')
    expect(reset.dateFrom).toBe('')
    expect(reset.dateTo).toBe('')
    expect(reset.sortOrder).toBe('date-desc')
    expect(reset.showDateFilters).toBe(false)
    expect(reset.page).toBe(1)
    expect(reset.pageSize).toBe(15)
  })
})
