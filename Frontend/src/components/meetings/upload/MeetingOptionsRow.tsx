import { type LanguageOption } from '../../../api/queries/useSettingsQueries'
import InlineInput from '../../common/InlineInput'
import { type MeetingFormData } from './UploadMeetingsForm'

interface MeetingOptionsRowProps {
  index: number
  meeting: MeetingFormData
  languages: LanguageOption[]
  isPending: boolean
  isExpanded: boolean
}

export default function MeetingOptionsRow({
  index,
  meeting,
  languages,
  isPending,
  isExpanded,
}: MeetingOptionsRowProps) {
  if (!isExpanded) {
    return (
      <div className="hidden [grid-column:1/-1]">
        <input type="hidden" name={`meetings[${index}][language]`} value={meeting.language ?? ''} />
        <input type="hidden" name={`meetings[${index}][speakers]`} value={meeting.speakers ?? ''} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-6 pb-3 [grid-column:2/-1]">
      <div className="flex items-center gap-2">
        <label className="font-ubuntu shrink-0 text-xs text-stone-400">Language</label>
        <select
          name={`meetings[${index}][language]`}
          disabled={isPending}
          defaultValue={meeting.language ?? ''}
          key={`${meeting.id}-language-${meeting.language ?? 'none'}`}
          className="font-ubuntu h-7 rounded-lg border border-stone-200 bg-transparent px-2 text-xs text-stone-600 outline-none focus:border-stone-400"
        >
          <option value="">Any</option>
          {languages.map(l => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="font-ubuntu shrink-0 text-xs text-stone-400">Speakers</label>
        <InlineInput
          name={`meetings[${index}][speakers]`}
          type="number"
          min="2"
          disabled={isPending}
          defaultValue={meeting.speakers}
          placeholder="—"
          className="h-7 w-20 text-xs"
        />
      </div>
    </div>
  )
}
