import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type Meeting } from '../../../types/meetings'
import DangerButton from '../../ui/buttons/DangerButton'
import Input from '../../ui/inputs/Input'
import Select from '../../ui/inputs/Select'
import ColumnHeader from '../ColumnHeader'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}

type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

const listSearch = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-list-search"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M11 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    <path d="M18.5 18.5l2.5 2.5" />
    <path d="M4 6h16" />
    <path d="M4 12h4" />
    <path d="M4 18h4" />
  </svg>
)

const calendarFilter = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="icon icon-tabler icons-tabler-outline icon-tabler-calendar-search"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4.5" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M4 11h16" />
    <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    <path d="M20.2 20.2l1.8 1.8" />
  </svg>
)

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc')
  const [showDateFilters, setShowDateFilters] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const gridCols = 'grid-cols-[20px_1fr_150px_32px_32px]'
  const hasDateFilter = dateFrom !== '' || dateTo !== ''

  const filteredMeetings = meetings.filter(m => {
    const matchesQuery = !query || fuzzyMatch(m.title, query)
    const matchesFrom = !dateFrom || m.date >= dateFrom
    const matchesTo = !dateTo || m.date <= dateTo
    return matchesQuery && matchesFrom && matchesTo
  })

  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
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

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-2">
        {/* Row 1: search + date filter toggle + sort */}
        <div className="flex items-end gap-3">
          <Input
            label={t('meetings.list.searchLabel')}
            type="search"
            placeholder={t('meetings.list.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            containerClassName="flex flex-1 flex-col"
            startIcon={listSearch}
            className="pr-3 pl-9"
          />
          <button
            type="button"
            title={t('meetings.list.dateFilterToggle')}
            onClick={() => setShowDateFilters(v => !v)}
            className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
              hasDateFilter || showDateFilters
                ? 'border-stone-500 bg-stone-200 text-stone-800 dark:border-stone-400 dark:bg-stone-700 dark:text-stone-100'
                : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700 dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-stone-200'
            }`}
          >
            {calendarFilter}
            <span className="font-ubuntu">
              {t('meetings.list.dateFilterToggle')}
            </span>
            {hasDateFilter && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-500 text-xs text-white dark:bg-stone-400 dark:text-stone-900">
                •
              </span>
            )}
          </button>
          {hasDateFilter && (
            <DangerButton
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
            >
              {t('meetings.list.clearDates')}
            </DangerButton>
          )}
          <Select
            label={t('meetings.list.sortLabel')}
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            containerClassName="flex flex-col w-40"
          >
            <option value="date-desc">
              {t('meetings.list.sortNewestFirst')}
            </option>
            <option value="date-asc">
              {t('meetings.list.sortOldestFirst')}
            </option>
            <option value="title-asc">{t('meetings.list.sortAZ')}</option>
            <option value="title-desc">{t('meetings.list.sortZA')}</option>
          </Select>
        </div>

        {/* Row 2: date filters (collapsible) */}
        {showDateFilters && (
          <div className="flex items-end gap-3">
            <Input
              label={t('meetings.list.fromLabel')}
              type="date"
              value={dateFrom}
              max={today}
              onChange={e => setDateFrom(e.target.value)}
              containerClassName="flex flex-col w-40"
            />
            <Input
              label={t('meetings.list.toLabel')}
              type="date"
              value={dateTo}
              max={today}
              onChange={e => setDateTo(e.target.value)}
              containerClassName="flex flex-col w-40"
            />
            <DangerButton
              disabled={!hasDateFilter}
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
            >
              {t('meetings.list.clearDates')}
            </DangerButton>
          </div>
        )}
      </div>

      <div
        className={`grid ${gridCols} gap-6 border-b border-stone-300 px-4 py-3 dark:border-stone-600`}
      >
        <ColumnHeader>#</ColumnHeader>
        <ColumnHeader>Title</ColumnHeader>
        <ColumnHeader>Date</ColumnHeader>
        <div />
        <div />
      </div>

      <div className="flex flex-col">
        {sortedMeetings.map((meeting, index) => (
          <MeetingItem
            key={meeting.id}
            meeting={meeting}
            index={index + 1}
            gridCols={gridCols}
          />
        ))}
      </div>
    </div>
  )
}

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
