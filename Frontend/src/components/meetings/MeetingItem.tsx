import { useState, useTransition } from 'react'

import { type Meeting } from '../../store/types'
import MeetingItemEdit from './MeetingItemEdit'
import MeetingItemView from './MeetingItemView'

interface MeetingItemProps {
  meeting: Meeting
  index: number
  gridCols: string
  onDeleteMeeting: (id: string) => void
  onUpdateMeeting: (id: string, data: Partial<Meeting>) => void
}

export interface EditState {
  isEditing: boolean
  title: string
  date: string
}

export default function MeetingItem({
  meeting,
  index,
  gridCols,
  onDeleteMeeting,
  onUpdateMeeting,
}: MeetingItemProps) {
  const [isPending, startTransition] = useTransition()

  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    title: meeting.title,
    date: meeting.date,
  })

  return (
    <div
      className={`grid ${gridCols} items-center gap-6 border-b border-stone-200 px-4 py-2 transition-colors duration-150 hover:bg-stone-100`}
    >
      {editState.isEditing ? (
        <MeetingItemEdit
          meeting={meeting}
          index={index}
          editState={editState}
          isPending={isPending}
          setEditState={setEditState}
          onUpdateMeeting={onUpdateMeeting}
          startTransition={startTransition}
        />
      ) : (
        <MeetingItemView
          meeting={meeting}
          index={index}
          isPending={isPending}
          setEditState={setEditState}
          onDeleteMeeting={onDeleteMeeting}
          startTransition={startTransition}
        />
      )}
    </div>
  )
}
