import { useOptimistic } from 'react'

import { type Meeting } from '../../stores/meetingsStore'
import MeetingItem from './MeetingItem'

interface MeetingsListProps {
  meetings: Meeting[]
}

type OptimisticAction =
  | { type: 'delete'; id: string }
  | { type: 'update'; id: string; data: Partial<Meeting> }

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const [optimisticMeetings, updateOptimisticMeetings] = useOptimistic(
    meetings,
    optimisticMeetingsReducer,
  )

  const handleDelete = (id: string) => {
    updateOptimisticMeetings({ type: 'delete', id })
  }

  const handleUpdate = (id: string, data: Partial<Meeting>) => {
    updateOptimisticMeetings({ type: 'update', id, data })
  }

  const gridCols = 'grid-cols-[20px_500px_150px_auto_auto]'
  const titlesClasses =
    'font-ubuntu text-sm tracking-wide text-stone-500 uppercase'

  return (
    <div className="mx-auto w-fit">
      <div
        className={`grid ${gridCols} gap-6 border-b border-stone-300 px-4 py-3`}
      >
        <span className={titlesClasses}>#</span>
        <span className={titlesClasses}>Título</span>
        <span className={titlesClasses}>Fecha</span>
      </div>

      <div className="flex flex-col">
        {optimisticMeetings.map((meeting, index) => (
          <MeetingItem
            key={meeting.id}
            meeting={meeting}
            index={index + 1}
            gridCols={gridCols}
            onDeleteMeeting={handleDelete}
            onUpdateMeeting={handleUpdate}
          />
        ))}
      </div>
    </div>
  )
}

function optimisticMeetingsReducer(
  state: Meeting[],
  action: OptimisticAction,
): Meeting[] {
  switch (action.type) {
    case 'delete':
      return state.filter(m => m.id !== action.id)
    case 'update':
      return state.map(m => (m.id === action.id ? { ...m, ...action.data } : m))
    default:
      return state
  }
}
