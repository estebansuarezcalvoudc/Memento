import {
  useMeetingListDateFrom,
  useMeetingListDateTo,
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
  const query = useMeetingListQuery()
  const dateFrom = useMeetingListDateFrom()
  const dateTo = useMeetingListDateTo()
  const sortOrder = useMeetingListSortOrder()

  const sortedMeetings = meetings
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

  return { sortedMeetings }
}
