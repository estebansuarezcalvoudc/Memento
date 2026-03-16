import { useEffect } from 'react'

import {
  useMeetingListDateFrom,
  useMeetingListDateTo,
  useMeetingListPage,
  useMeetingListPageSize,
  useMeetingListQuery,
  useMeetingListSortOrder,
} from '../stores/meetingListStore'
import { type Meeting } from '../types/meetings'

function fuzzyMatch(title: string, query: string): boolean {
  let qi = 0
  for (const char of title.toLowerCase()) {
    if (char === query[qi]?.toLowerCase()) {
      qi++
    }
    if (qi === query.length) {
      return true
    }
  }
  return false
}

export function useMeetingListFilters(meetings: Meeting[]) {
  const [query, _setQuery] = useMeetingListQuery()
  const [dateFrom, _setDateFrom] = useMeetingListDateFrom()
  const [dateTo, _setDateTo] = useMeetingListDateTo()
  const [sortOrder, _setSortOrder] = useMeetingListSortOrder()
  const [page, setPage] = useMeetingListPage()
  const [pageSize, _setPageSize] = useMeetingListPageSize()

  const filteredAndSorted = meetings
    .filter(m => {
      const matchesQuery = !query || fuzzyMatch(m.title, query)
      const matchesFrom = !dateFrom || m.date >= dateFrom
      const matchesTo = !dateTo || m.date <= dateTo
      return matchesQuery && matchesFrom && matchesTo
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return b.date.localeCompare(a.date)
        case 'date-asc':
          return a.date.localeCompare(b.date)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
      }
    })

  const totalCount = filteredAndSorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Reset to page 1 when filters change and current page is out of range
  useEffect(() => {
    if (page > totalPages) {
      setPage(1)
    }
  }, [query, dateFrom, dateTo, sortOrder, totalCount, pageSize, page, setPage])

  const safePage = Math.min(page, totalPages)
  const pagedMeetings = filteredAndSorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  return { pagedMeetings, totalPages, currentPage: safePage, totalCount }
}
