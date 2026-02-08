import { useState } from 'react'

import { cancelEditImage, confirmEditImage } from '../../assets/buttonsImages'
import { type Meeting } from '../../pages/Meetings'
import { useUpdateMeeting } from '../../stores/meetingsStore'
import MeetingButton from './MeetingButton'
import { type EditState } from './MeetingItem'

interface MeetingItemEditProps {
  meeting: Meeting
  index: number
  editState: EditState
  isPending: boolean
  setEditState: React.Dispatch<React.SetStateAction<EditState>>
  onUpdateMeeting: (id: string, data: Partial<Meeting>) => void
  startTransition: (callback: () => void) => void
}

export default function MeetingItemEdit({
  meeting,
  index,
  editState,
  isPending,
  setEditState,
  onUpdateMeeting,
  startTransition,
}: MeetingItemEditProps) {
  const updateMeetingInStore = useUpdateMeeting()
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (title: string) => {
    setEditState(prev => ({ ...prev, title }))
    setError(null)
  }

  const handleDateChange = (date: string) => {
    setEditState(prev => ({ ...prev, date }))
    setError(null)
  }

  const handleCancel = () => {
    setEditState({
      isEditing: false,
      title: meeting.title,
      date: meeting.date,
    })
    setError(null)
  }

  const handleConfirm = async () => {
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

    setError(null)

    try {
      const token = localStorage.getItem('access_token')

      if (!token) {
        throw new Error('No access token found')
      }

      const url = `/api/meetings/${meeting.id}`
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update meeting: ${response.status}`)
      }

      // Only update after successful response
      startTransition(() => {
        onUpdateMeeting(meeting.id, updates)
      })

      updateMeetingInStore(meeting.id, updates)
      setEditState(prev => ({ ...prev, isEditing: false }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update meeting'
      setError(errorMessage)
    }
  }

  return (
    <>
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={editState.title}
          onChange={e => handleTitleChange(e.target.value)}
          className="font-ubuntu h-6 truncate rounded border border-stone-300 px-2 text-base text-stone-800 focus:border-blue-500 focus:outline-none"
          disabled={isPending}
        />
        {error && (
          <span className="font-ubuntu text-xs text-red-600">{error}</span>
        )}
      </div>
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
        bgColor="bg-green-200"
        textColor="text-green-700"
        disabled={isPending}
      />
      <MeetingButton
        image={cancelEditImage}
        onClick={handleCancel}
        bgColor="bg-red-200"
        textColor="text-red-700"
        disabled={isPending}
      />
    </>
  )
}
