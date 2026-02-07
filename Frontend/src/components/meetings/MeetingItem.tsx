import { useState, useTransition } from 'react'

import { cancelEditImage, confirmEditImage, editImage, removeImage } from '../../assets/buttonsImages'
import { type Meeting } from '../../pages/Meetings'
import { useRemoveMeeting, useUpdateMeeting } from '../../stores/meetingsStore'

interface MeetingItemProps {
  meeting: Meeting
  index: number
  gridCols: string
  onDeleteMeeting: (id: string) => void
  onUpdateMeeting: (id: string, data: Partial<Meeting>) => void
}

interface EditState {
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
  const deleteMeetingFromStore = useRemoveMeeting()
  const updateMeetingInStore = useUpdateMeeting()
  const [isPending, startTransition] = useTransition()

  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    title: meeting.title,
    date: meeting.date,
  })

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

  const handleEdit = () => {
    setEditState({
      isEditing: true,
      title: meeting.title,
      date: meeting.date,
    })
  }

  const handleCancel = () => {
    setEditState({
      isEditing: false,
      title: meeting.title,
      date: meeting.date,
    })
  }

  const handleConfirm = async () => {
    const updates: Partial<Meeting> = {}

    if (editState.title !== meeting.title) {
      updates.title = editState.title
    }

    if (editState.date !== meeting.date) {
      updates.date = editState.date
    }

    if (Object.keys(updates).length === 0) {
      setEditState(prev => ({ ...prev, isEditing: false }))
      return
    }

    startTransition(() => {
      onUpdateMeeting(meeting.id, updates)
    })

    setEditState(prev => ({ ...prev, isEditing: false }))

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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      updateMeetingInStore(meeting.id, updates)
    } catch (error) {
      console.error('Error updating meeting:', error)
    }
  }

  return (
    <div
      className={`grid ${gridCols} items-center gap-6 border-b border-stone-200 px-4 py-2 transition-colors duration-150 hover:bg-stone-100`}
    >
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>

      {editState.isEditing ? (
        <input
          type="text"
          value={editState.title}
          onChange={e =>
            setEditState(prev => ({ ...prev, title: e.target.value }))
          }
          className="font-ubuntu truncate rounded border border-stone-300 px-2 text-base text-stone-800 focus:border-blue-500 focus:outline-none h-6"
          disabled={isPending}
        />
      ) : (
        <span className="font-ubuntu truncate text-base text-stone-800">
          {meeting.title}
        </span>
      )}

      {editState.isEditing ? (
        <input
          type="date"
          value={editState.date}
          onChange={e =>
            setEditState(prev => ({ ...prev, date: e.target.value }))
          }
          className="font-ubuntu rounded border border-stone-300 px-2 text-base text-stone-600 focus:border-blue-500 focus:outline-none h-6"
          disabled={isPending}
        />
      ) : (
        <span className="font-ubuntu text-base text-stone-600">
          {meeting.date}
        </span>
      )}

      {editState.isEditing ? (
        <>
          <button
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-green-200 hover:text-green-700 disabled:opacity-50"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {confirmEditImage}
          </button>
          <button
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-red-200 hover:text-red-700 disabled:opacity-50"
            onClick={handleCancel}
            disabled={isPending}
          >
            {cancelEditImage}
          </button>
        </>
      ) : (
        <>
          <button
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-blue-200 hover:text-blue-700 disabled:opacity-50"
            onClick={handleEdit}
            disabled={isPending}
          >
            {editImage}
          </button>
          <button
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-red-200 hover:text-red-700 disabled:opacity-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            {removeImage}
          </button>
        </>
      )}
    </div>
  )
}
