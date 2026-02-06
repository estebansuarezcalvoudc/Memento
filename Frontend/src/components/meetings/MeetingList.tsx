import { type Meeting } from '../../pages/Meetings'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}
export default function MeetingsList({ meetings }: MeetingsListProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-[150px_300px_150px] gap-16 px-4 py-3 border-b border-stone-300">
        <span className="font-ubuntu text-sm tracking-wide text-stone-500 uppercase">
          #
        </span>
        <span className="font-ubuntu text-sm tracking-wide text-stone-500 uppercase">
          Título
        </span>
        <span className="font-ubuntu text-sm tracking-wide text-stone-500 uppercase">
          Fecha
        </span>
      </div>
      <div className="flex flex-col">
        {meetings.map((meeting, index) => (
          <MeetingItem key={meeting.id} meeting={meeting} index={index + 1} />
        ))}
      </div>
    </div>
  )
}
