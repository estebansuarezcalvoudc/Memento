import { type Meeting } from '../../pages/Meetings'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}
export default function MeetingsList({ meetings }: MeetingsListProps) {
  return (
    <div className="mx-auto w-fit">
      <div className="grid grid-cols-[60px_300px_150px_auto_auto] gap-6 px-4 py-3 border-b border-stone-300">
        <span className="font-ubuntu text-sm tracking-wide text-stone-500 uppercase">
          #
        </span>
        <span className="font-ubuntu text-sm tracking-wide text-stone-500 uppercase">
          Título
        </span>
        <span className="font-ubuntu text-sm tracking-wide text-stone-500 uppercase">
          Fecha
        </span>
        <span></span>
        <span></span>
      </div>
      <div className="flex flex-col">
        {meetings.map((meeting, index) => (
          <MeetingItem key={meeting.id} meeting={meeting} index={index + 1} />
        ))}
      </div>
    </div>
  )
}
