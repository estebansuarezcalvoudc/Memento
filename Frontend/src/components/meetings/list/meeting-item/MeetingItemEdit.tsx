import { useUpdateMeeting } from '../../../../api/queries/useMeetingsQueries'
import {
  cancelEditImage,
  confirmEditImage,
} from '../../../../assets/buttonsImages'
import { type Meeting } from '../../../../types/meetings'
import { localDateString } from '../../../../utils/date'
import MeetingButton from '../../MeetingButton'
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
  const today = localDateString()

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
      <span className="font-ubuntu text-base text-stone-500 dark:text-stone-400">
        {index}
      </span>
      <input
        type="text"
        value={editState.title}
        onChange={e => handleTitleChange(e.target.value)}
        className="font-ubuntu h-6 truncate rounded border border-stone-300 px-2 text-base text-stone-800 focus:border-blue-500 focus:outline-none dark:border-stone-600 dark:bg-transparent dark:text-stone-100"
        disabled={isPending}
      />
      <input
        type="date"
        value={editState.date}
        onChange={e => handleDateChange(e.target.value)}
        className="font-ubuntu h-6 rounded border border-stone-300 px-2 text-base text-stone-600 focus:border-blue-500 focus:outline-none dark:border-stone-600 dark:bg-transparent dark:text-stone-300"
        disabled={isPending}
        max={today}
      />
      <MeetingButton
        image={confirmEditImage}
        onClick={handleConfirm}
        bgColor="hover:bg-green-300"
        textColor="hover:text-green-800"
        disabled={isPending}
        ariaLabel="Confirm"
      />
      <MeetingButton
        image={cancelEditImage}
        onClick={handleCancel}
        bgColor="hover:bg-red-300"
        textColor="hover:text-red-800"
        disabled={isPending}
        ariaLabel="Cancel"
      />
    </>
  )
}
