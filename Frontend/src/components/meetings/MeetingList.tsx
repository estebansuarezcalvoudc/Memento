import { useOptimistic } from 'react'

import { type Meeting } from '../../pages/Meetings'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const [optimisticMeetings, deleteOptimisticMeeting] = useOptimistic(
    meetings,
    (state, deletedId: string) => state.filter((m) => m.id !== deletedId)
  )

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
        {optimisticMeetings.map((meeting, index) => (
          <MeetingItem key={meeting.id} meeting={meeting} index={index + 1} onDeleteMeeting={deleteOptimisticMeeting} />
        ))}
      </div>
    </div>
  )
}
