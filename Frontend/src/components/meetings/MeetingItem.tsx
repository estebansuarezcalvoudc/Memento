import { editImage, removeImage } from '../../assets/removeImage'
import { type Meeting } from '../../pages/Meetings'

interface MeetingItemProps {
  meeting: Meeting
  index: number
}

export default function MeetingItem({ meeting, index }: MeetingItemProps) {
  return (
    <div className="grid grid-cols-[60px_300px_150px_auto_auto] items-center gap-6 border-b border-stone-200 px-4 py-2 transition-colors duration-150 hover:bg-stone-100">
      <span className="font-ubuntu text-sm text-stone-500">{index}</span>
      <span className="font-ubuntu text-base text-stone-800">
        {meeting.title}
      </span>
      <span className="font-ubuntu text-base text-stone-600">{meeting.date}</span>
      <button className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-blue-200 hover:text-blue-700">
        {editImage}
      </button>
      <button className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 hover:bg-red-200 hover:text-red-700">
        {removeImage}
      </button>
    </div>
  )
}
