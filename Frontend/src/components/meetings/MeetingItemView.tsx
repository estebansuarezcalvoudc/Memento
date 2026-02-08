import { editImage, removeImage } from '../../assets/buttonsImages'
import { type Meeting } from '../../pages/Meetings'
import MeetingButton from './MeetingButton'
import type { EditState } from './MeetingItem'
import { useRemoveMeeting } from '../../stores/meetingsStore'

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
  const deleteMeetingFromStore = useRemoveMeeting()

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

    const token = localStorage.getItem('access_token')

    if (!token) {
      throw new Error('No access token found')
    }

    const url = `/api/meetings/${meeting.id}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    deleteMeetingFromStore(meeting.id)
  }

  return (
    <>
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <span className="font-ubuntu truncate text-base text-stone-800">
        {meeting.title}
      </span>
      <span className="font-ubuntu text-base text-stone-600">
        {meeting.date}
      </span>
      <MeetingButton
        image={editImage}
        onClick={handleEdit}
        bgColor="bg-blue-200"
        textColor="text-blue-700"
        disabled={isPending}
      />
      <MeetingButton
        image={removeImage}
        onClick={handleDelete}
        bgColor="bg-red-200"
        textColor="text-red-700"
        disabled={isPending}
      />
    </>
  )
}
