import { editImage, removeImage } from '../../assets/buttonsImages'
import { useRemoveMeeting, type Meeting } from '../../stores/meetingsStore'
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
  const deleteMeetingFromStore = useRemoveMeeting()

  const handleEdit = () => {
    setEditState({
      isEditing: true,
      title: meeting.title,
      date: meeting.date,
    })
  }

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('access_token')

      if (!token) {
        window.alert('You are not authorized to delete this meeting.')
        return
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

      startTransition(() => {
        onDeleteMeeting(meeting.id)
      })
    } catch (error) {
      console.error('Failed to delete meeting:', error)
      window.alert('Failed to delete the meeting. Please try again.')
    }
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
