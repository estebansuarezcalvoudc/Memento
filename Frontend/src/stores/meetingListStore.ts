import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

interface MeetingListStore {
  query: string
  dateFrom: string
  dateTo: string
  sortOrder: SortOrder
  showDateFilters: boolean
  page: number
  pageSize: number
  setQuery: (query: string) => void
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
  setSortOrder: (order: SortOrder) => void
  toggleDateFilters: () => void
  clearDates: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}

const useMeetingListStore = create<MeetingListStore>()(
  persist(
    set => ({
      query: '',
      dateFrom: '',
      dateTo: '',
      sortOrder: 'date-desc',
      showDateFilters: false,
      page: 1,
      pageSize: 15,
      setQuery: (query: string) => set({ query }),
      setDateFrom: (dateFrom: string) => set({ dateFrom }),
      setDateTo: (dateTo: string) => set({ dateTo }),
      setSortOrder: (sortOrder: SortOrder) => set({ sortOrder }),
      toggleDateFilters: () =>
        set(state => ({ showDateFilters: !state.showDateFilters })),
      clearDates: () => set({ dateFrom: '', dateTo: '' }),
      setPage: (page: number) => set({ page }),
      setPageSize: (size: number) => set({ pageSize: size }),
    }),
    {
      name: 'meeting-list-filters',
      partialize: state => ({
        query: state.query,
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
        sortOrder: state.sortOrder,
        showDateFilters: state.showDateFilters,
        page: state.page,
        pageSize: state.pageSize,
      }),
    },
  ),
)

export const useMeetingListQuery = () =>
  [
    useMeetingListStore(state => state.query),
    useMeetingListStore(state => state.setQuery),
  ] as const

export const useMeetingListDateFrom = () =>
  [
    useMeetingListStore(state => state.dateFrom),
    useMeetingListStore(state => state.setDateFrom),
  ] as const

export const useMeetingListDateTo = () =>
  [
    useMeetingListStore(state => state.dateTo),
    useMeetingListStore(state => state.setDateTo),
  ] as const

export const useMeetingListSortOrder = () =>
  [
    useMeetingListStore(state => state.sortOrder),
    useMeetingListStore(state => state.setSortOrder),
  ] as const

export const useMeetingListPage = () =>
  [
    useMeetingListStore(state => state.page),
    useMeetingListStore(state => state.setPage),
  ] as const

export const useMeetingListPageSize = () =>
  [
    useMeetingListStore(state => state.pageSize),
    useMeetingListStore(state => state.setPageSize),
  ] as const

export const useMeetingListShowDates = () =>
  useMeetingListStore(state => state.showDateFilters)
export const useMeetingListHasDateFilter = () =>
  useMeetingListStore(state => state.dateFrom !== '' || state.dateTo !== '')

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
    page: 1,
    pageSize: 15,
  })

export const _getMeetingListState = () => useMeetingListStore.getState()
