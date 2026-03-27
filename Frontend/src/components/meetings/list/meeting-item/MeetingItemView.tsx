import { NavLink } from 'react-router-dom'

import { editImage, removeImage } from '../../../../assets/buttonsImages'
import { type Meeting } from '../../../../types/meetings'
import MeetingButton from '../../MeetingButton'
import type { EditState } from './MeetingItem'

interface MeetingItemViewProps {
  meeting: Meeting
  index: number
  setEditState: (state: EditState) => void
  onRequestDelete: (meeting: Meeting) => void
}

export default function MeetingItemView({
  meeting,
  index,
  setEditState,
  onRequestDelete,
}: MeetingItemViewProps) {
  const handleEdit = () => {
    setEditState({
      isEditing: true,
      title: meeting.title,
      date: meeting.date,
    })
  }

  return (
    <>
      <span className="font-ubuntu text-base text-stone-500 dark:text-stone-400">
        {index}
      </span>
      <NavLink
        to={`/meetings/${meeting.id}/transcription`}
        className="font-ubuntu truncate text-base text-stone-800 dark:text-stone-100"
      >
        {meeting.title}
      </NavLink>
      <span className="font-ubuntu text-base text-stone-600 dark:text-stone-400">
        {meeting.date}
      </span>
      <MeetingButton
        image={editImage}
        onClick={handleEdit}
        bgColor="hover:bg-blue-300"
        textColor="hover:text-blue-800"
        ariaLabel="Edit"
      />
      <MeetingButton
        image={removeImage}
        onClick={() => onRequestDelete(meeting)}
        bgColor="hover:bg-red-300"
        textColor="hover:text-red-800"
        ariaLabel="Delete"
      />
    </>
  )
}
