import { type Meeting } from '../../pages/Meetings'

interface MeetingItemProps {
  meeting: Meeting
  index: number
}

export default function MeetingItem({ meeting, index }: MeetingItemProps) {
  return (
    <div
      className="grid grid-cols-[150px_300px_150px] gap-16 px-4 py-3 items-center cursor-pointer transition-colors duration-150 border-b border-stone-200 hover:bg-stone-100">
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <span className="font-ubuntu text-base text-stone-800">
        {meeting.title}
      </span>
      <span className="font-ubuntu text-sm text-stone-600">
        {meeting.date}
      </span>
    </div>
  )
}
