import { useRemoveMeeting } from '../../stores/meetingsStore'
import { editImage, removeImage } from '../../assets/removeImage'
import { type Meeting } from '../../pages/Meetings'
import { useTransition } from 'react'

interface MeetingItemProps {
  meeting: Meeting
  index: number
  onDeleteMeeting: (id: string) => void
}

export default function MeetingItem({ meeting, index, onDeleteMeeting }: MeetingItemProps) {
  const deleteMeetingFromStore = useRemoveMeeting()
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    startTransition(() => {
      onDeleteMeeting(meeting.id) // Actualización optimista
    })

    try {
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

      deleteMeetingFromStore(meeting.id) // Actualizar store real
    } catch (error) {
      console.error('Error deleting meeting:', error)
      // Si falla, el estado optimista se revertirá en el próximo render
    }
  }

  return (
    <div className="grid grid-cols-[60px_300px_150px_auto_auto] items-center gap-6 border-b border-stone-200 px-4 py-2 transition-colors duration-150 hover:bg-stone-100">
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <span className="font-ubuntu text-base text-stone-800">
        {meeting.title}
      </span>
      <span className="font-ubuntu text-base text-stone-600">
        {meeting.date}
      </span>
      <button className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-blue-200 hover:text-blue-700">
        {editImage}
      </button>
      <button
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-red-200 hover:text-red-700 disabled:opacity-50"
        onClick={handleDelete}
        disabled={isPending}
      >
        {removeImage}
      </button>
    </div>
  )
}
