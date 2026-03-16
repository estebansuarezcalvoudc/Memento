import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

interface MeetingListStore {
  query: string
  dateFrom: string
  dateTo: string
  sortOrder: SortOrder
  showDateFilters: boolean
  setQuery: (query: string) => void
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
  setSortOrder: (order: SortOrder) => void
  toggleDateFilters: () => void
  clearDates: () => void
}

const useMeetingListStore = create<MeetingListStore>()(
  persist(
    set => ({
      query: '',
      dateFrom: '',
      dateTo: '',
      sortOrder: 'date-desc',
      showDateFilters: false,
      setQuery: (query: string) => set({ query }),
      setDateFrom: (dateFrom: string) => set({ dateFrom }),
      setDateTo: (dateTo: string) => set({ dateTo }),
      setSortOrder: (sortOrder: SortOrder) => set({ sortOrder }),
      toggleDateFilters: () =>
        set(state => ({ showDateFilters: !state.showDateFilters })),
      clearDates: () => set({ dateFrom: '', dateTo: '' }),
    }),
    {
      name: 'meeting-list-filters',
      partialize: state => ({
        query: state.query,
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
        sortOrder: state.sortOrder,
        showDateFilters: state.showDateFilters,
      }),
    },
  ),
)

export const useMeetingListQuery = () =>
  useMeetingListStore(state => state.query)
export const useMeetingListDateFrom = () =>
  useMeetingListStore(state => state.dateFrom)
export const useMeetingListDateTo = () =>
  useMeetingListStore(state => state.dateTo)
export const useMeetingListSortOrder = () =>
  useMeetingListStore(state => state.sortOrder)
export const useMeetingListShowDates = () =>
  useMeetingListStore(state => state.showDateFilters)
export const useMeetingListHasDateFilter = () =>
  useMeetingListStore(state => state.dateFrom !== '' || state.dateTo !== '')

export const useSetMeetingListQuery = () =>
  useMeetingListStore(state => state.setQuery)
export const useSetMeetingListDateFrom = () =>
  useMeetingListStore(state => state.setDateFrom)
export const useSetMeetingListDateTo = () =>
  useMeetingListStore(state => state.setDateTo)
export const useSetMeetingListSortOrder = () =>
  useMeetingListStore(state => state.setSortOrder)
export const useToggleMeetingListDates = () =>
  useMeetingListStore(state => state.toggleDateFilters)
export const useClearMeetingListDates = () =>
  useMeetingListStore(state => state.clearDates)

export const _resetMeetingListStore = () =>
  useMeetingListStore.setState({
    query: '',
    dateFrom: '',
    dateTo: '',
    sortOrder: 'date-desc',
    showDateFilters: false,
  })

export const _getMeetingListState = () => useMeetingListStore.getState()
