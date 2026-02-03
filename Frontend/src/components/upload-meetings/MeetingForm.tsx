import { removeImage } from '../../assets/removeImage'
import Input from '../common/Input'

interface Meeting {
  id: string
  title: string
  audioFile?: File
  meetingDate?: string
  language?: string
  speakers?: number
}

interface MeetingFormProps {
  meeting: Meeting
  index: number
  meetingsCount: number
  isPending: boolean
  onRemove: (id: string) => void
}

export default function MeetingForm({
  meeting,
  index,
  meetingsCount,
  isPending,
  onRemove,
}: MeetingFormProps) {
  return (
    <div
      key={meeting.id}
      className="mt-4 rounded-2xl border-2 border-dotted border-stone-400 bg-stone-100 p-3"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-ubuntu text-lg text-stone-700">
          Meeting {index + 1}
        </span>

        {meetingsCount > 1 && (
          <button
            type="button"
            onClick={() => onRemove(meeting.id)}
            disabled={isPending}
            className="cursor-pointer rounded-xl p-2 text-stone-700 hover:bg-stone-300"
          >
            {removeImage}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Title"
          name={`meetings[${index}][title]`}
          type="text"
          required
          disabled={isPending}
        />

        <Input
          label="Date"
          name={`meetings[${index}][date]`}
          type="date"
          required
          disabled={isPending}
        />

        <Input
          label="Language (optional)"
          name={`meetings[${index}][language]`}
          type="text"
          disabled={isPending}
        />

        <Input
          label="Number of speakers (optional)"
          name={`meetings[${index}][speakers]`}
          type="number"
          min="2"
          disabled={isPending}
        />

        <Input
          label="Audio File"
          name={`meetings[${index}][file]`}
          type="file"
          accept="audio/*"
          required
          disabled={isPending}
        />
      </div>
    </div>
  )
}
