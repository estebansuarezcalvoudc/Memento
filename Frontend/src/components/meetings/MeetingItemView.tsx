import { NavLink } from 'react-router-dom'

import { useDeleteMeetingMutation } from '../../api/useMeetingsQuery'
import type { Meeting } from '../../api/useMeetingsQuery'
import { editImage, removeImage } from '../../assets/buttonsImages'
import MeetingButton from './MeetingButton'
import type { EditState } from './MeetingItem'

interface MeetingItemViewProps {
  meeting: Meeting
  index: number
  isPending: boolean
  setEditState: (state: EditState) => void
  onDeleteMeeting: (id: string) => void
  startTransition: (callback: () => void) => void
}

export default function MeetingItemView({
  meeting,
  index,
  isPending,
  setEditState,
  onDeleteMeeting,
  startTransition,
}: MeetingItemViewProps) {
  const { mutate: deleteMeeting } = useDeleteMeetingMutation()

  const handleEdit = () => {
    setEditState({
      isEditing: true,
      title: meeting.title,
      date: meeting.date,
    })
  }

  const handleDelete = async () => {
    startTransition(() => {
      onDeleteMeeting(meeting.id)
    })
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
