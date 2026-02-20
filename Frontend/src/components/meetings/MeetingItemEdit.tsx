import { cancelEditImage, confirmEditImage } from '../../assets/buttonsImages'
import { useUpdateMeeting } from '../../hooks/useMeetingsQueries'
import { type Meeting } from '../../types/meetings'
import MeetingButton from './MeetingButton'
import { type EditState } from './MeetingItem'

interface MeetingItemEditProps {
  meeting: Meeting
  index: number
  editState: EditState
  setEditState: React.Dispatch<React.SetStateAction<EditState>>
}

export default function MeetingItemEdit({
  meeting,
  index,
  editState,
  setEditState,
}: MeetingItemEditProps) {
  const { mutate: updateMeeting, isPending } = useUpdateMeeting()

  const handleTitleChange = (title: string) => {
    setEditState(prev => ({ ...prev, title }))
  }

  const handleDateChange = (date: string) => {
    setEditState(prev => ({ ...prev, date }))
  }

  const handleCancel = () => {
    setEditState({
      isEditing: false,
      title: meeting.title,
      date: meeting.date,
    })
  }

  const handleConfirm = () => {
    const updates: Partial<Meeting> = {}

    if (editState.title !== meeting.title) {
      updates.title = editState.title
    }

    if (editState.date !== meeting.date) {
      updates.date = editState.date
    }

    const notUpdated = Object.keys(updates).length === 0
    if (notUpdated) {
      setEditState(prev => ({ ...prev, isEditing: false }))
      return
    }

    updateMeeting({ id: meeting.id, updates })
    setEditState(prev => ({ ...prev, isEditing: false }))
  }

  return (
    <>
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <input
        type="text"
        value={editState.title}
        onChange={e => handleTitleChange(e.target.value)}
        className="font-ubuntu h-6 truncate rounded border border-stone-300 px-2 text-base text-stone-800 focus:border-blue-500 focus:outline-none"
        disabled={isPending}
      />
      <input
        type="date"
        value={editState.date}
        onChange={e => handleDateChange(e.target.value)}
        className="font-ubuntu h-6 rounded border border-stone-300 px-2 text-base text-stone-600 focus:border-blue-500 focus:outline-none"
        disabled={isPending}
      />
      <MeetingButton
        image={confirmEditImage}
        onClick={handleConfirm}
        bgColor="hover:bg-green-200"
        textColor="hover:text-green-700"
        disabled={isPending}
      />
      <MeetingButton
        image={cancelEditImage}
        onClick={handleCancel}
        bgColor="hover:bg-red-200"
        textColor="hover:text-red-700"
        disabled={isPending}
      />
    </>
  )
}
