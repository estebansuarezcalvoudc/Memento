import { type Meeting } from '../../types/meetings'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const gridCols = 'grid-cols-[20px_1fr_150px_32px_32px]'
  const titlesClasses =
    'font-ubuntu text-sm tracking-wide text-stone-500 uppercase'

  return (
    <div className="w-full">
      <div
        className={`grid ${gridCols} gap-6 border-b border-stone-300 px-4 py-3`}
      >
        <span className={titlesClasses}>#</span>
        <span className={titlesClasses}>Title</span>
        <span className={titlesClasses}>Date</span>
        <div />
        <div />
      </div>

      <div className="flex flex-col">
        {meetings.map((meeting, index) => (
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
