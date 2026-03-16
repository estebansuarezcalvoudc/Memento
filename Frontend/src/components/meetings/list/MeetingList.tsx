import { useMeetingListFilters } from '../../../hooks/useMeetingListFilters'
import { type Meeting } from '../../../types/meetings'
import ColumnHeader from '../ColumnHeader'
import MeetingItem from './meeting-item/MeetingItem'
import MeetingDateFilters from './toolbar/MeetingDateFilters'
import MeetingListToolbar from './toolbar/MeetingListToolbar'

interface MeetingsListProps {
  meetings: Meeting[]
}

const gridCols = 'grid-cols-[20px_1fr_150px_32px_32px]'

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const { sortedMeetings } = useMeetingListFilters(meetings)

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-col gap-2">
        <MeetingListToolbar />
        <MeetingDateFilters />
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
