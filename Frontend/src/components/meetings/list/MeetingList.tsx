import { useState } from 'react'

import { type Meeting } from '../../../types/meetings'
import Input from '../../common/Input'
import Select from '../../common/Select'
import ColumnHeader from '../ColumnHeader'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}

type SortOrder = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc')

  const today = new Date().toISOString().split('T')[0]
  const gridCols = 'grid-cols-[20px_1fr_150px_32px_32px]'

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
      <div className="mb-3 flex items-end gap-3">
        <div className="relative w-1/2">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-stone-400 dark:text-stone-500">
            {listSearch}
          </span>
          <input
            type="search"
            placeholder="Search meetings..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="font-ubuntu h-9 w-full rounded-lg border border-stone-300 bg-transparent pr-3 pl-9 text-base text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus:border-stone-400"
          />
        </div>
        <Input
          label="From"
          type="date"
          value={dateFrom}
          max={today}
          onChange={e => setDateFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          max={today}
          onChange={e => setDateTo(e.target.value)}
        />
      </div>
      <div className="mb-3 w-1/4">
        <Select
          label="Sort by"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as SortOrder)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">A → Z</option>
          <option value="title-desc">Z → A</option>
        </Select>
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
