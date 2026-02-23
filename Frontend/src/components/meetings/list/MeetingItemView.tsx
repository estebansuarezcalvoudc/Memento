import { NavLink } from 'react-router-dom'

import { editImage, removeImage } from '../../../assets/buttonsImages'
import { useDeleteMeeting } from '../../../api/queries/useMeetingsQueries'
import { type Meeting } from '../../../types/meetings'
import MeetingButton from './MeetingButton'
import type { EditState } from './MeetingItem'

interface MeetingItemViewProps {
  meeting: Meeting
  index: number
  setEditState: (state: EditState) => void
}

export default function MeetingItemView({
  meeting,
  index,
  setEditState,
}: MeetingItemViewProps) {
  const { mutate: deleteMeeting, isPending } = useDeleteMeeting()

  const handleEdit = () => {
    setEditState({
      isEditing: true,
      title: meeting.title,
      date: meeting.date,
    })
  }

  const handleDelete = () => {
    deleteMeeting(meeting.id)
  }

  return (
    <>
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <NavLink
        to={`/meetings/${meeting.id}/transcription`}
        className="font-ubuntu truncate text-base text-stone-800"
      >
        {meeting.title}
      </NavLink>
      <span className="font-ubuntu text-base text-stone-600">
        {meeting.date}
      </span>
      <MeetingButton
        image={editImage}
        onClick={handleEdit}
        bgColor="hover:bg-blue-200"
        textColor="hover:text-blue-700"
        disabled={isPending}
      />
      <MeetingButton
        image={removeImage}
        onClick={handleDelete}
        bgColor="hover:bg-red-200"
        textColor="hover:text-red-700"
        disabled={isPending}
      />
    </>
  )
}
