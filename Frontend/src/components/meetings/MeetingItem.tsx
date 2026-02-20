import { useState } from 'react'

import { type Meeting } from '../../types/meetings'
import MeetingItemEdit from './MeetingItemEdit'
import MeetingItemView from './MeetingItemView'

interface MeetingItemProps {
  meeting: Meeting
  index: number
  gridCols: string
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
}: MeetingItemProps) {
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
          setEditState={setEditState}
        />
      ) : (
        <MeetingItemView
          meeting={meeting}
          index={index}
          setEditState={setEditState}
        />
      )}
    </div>
  )
}
