import { removeImage } from '../../assets/buttonsImages'
import { SUPPORTED_LANGUAGES } from '../../utils/supportedLanguages'
import Input from '../common/Input'
import Select from '../common/Select'
import { type MeetingFormData } from './UploadMeetingsForm'

interface MeetingFormProps {
  meeting: MeetingFormData
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
  const today = new Date().toISOString().split('T')[0]

  return (
    <div
      key={meeting.id}
      className="mt-4 rounded-2xl border-2 border-dotted border-stone-400 bg-stone-100 p-3"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-ubuntu text-lg text-stone-700">
          Meeting {index + 1}
        </span>

        <button
          type="button"
          onClick={() => onRemove(meeting.id)}
          disabled={isPending || meetingsCount == 1}
          className="cursor-pointer rounded-xl p-1 text-stone-700 hover:bg-stone-300 disabled:opacity-50"
          aria-label="remove-meeting"
        >
          {removeImage}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Title"
          name={`meetings[${index}][title]`}
          type="text"
          required
          disabled={isPending}
          defaultValue={meeting.title}
        />

        <Input
          label="Date"
          name={`meetings[${index}][date]`}
          type="date"
          required
          defaultValue={meeting.date || today}
          max={today}
          disabled={isPending}
        />

        <Select
          label="Language"
          name={`meetings[${index}][language]`}
          options={SUPPORTED_LANGUAGES}
          placeholder="Select a language"
          disabled={isPending}
          defaultValue={meeting.language}
          key={`${meeting.id}-language-${meeting.language || 'none'}`}
        />

        <Input
          label="Number of speakers"
          name={`meetings[${index}][speakers]`}
          type="number"
          min="2"
          disabled={isPending}
          defaultValue={meeting.speakers}
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
