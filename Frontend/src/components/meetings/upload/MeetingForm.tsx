import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type LanguageOption } from '../../../api/queries/useSettingsQueries'
import { localDateString } from '../../../utils/date'
import FilePickerInput from '../../ui/inputs/FilePickerInput'
import InlineInput from '../../ui/inputs/InlineInput'
import ChevronToggleButton from './ChevronToggleButton'
import MeetingOptionsRow from './MeetingOptionsRow'
import RemoveButton from './RemoveButton'
import { type MeetingFormData } from './UploadMeetingsForm'

export interface MeetingFormProps {
  meeting: MeetingFormData
  index: number
  meetingsCount: number
  isPending: boolean
  onRemove: (id: string) => void
  languages: LanguageOption[]
}

export const meetingFormGridCols =
  'grid-cols-[20px_minmax(180px,240px)_170px_minmax(180px,240px)_32px_32px]'

const resetPlacementClass = 'min-[800px]:col-auto min-[800px]:row-auto'

export default function MeetingForm({
  meeting,
  index,
  meetingsCount,
  isPending,
  onRemove,
  languages,
}: MeetingFormProps) {
  const { t } = useTranslation()
  const today = localDateString()
  const [isExpanded, setIsExpanded] = useState(false)
  const [language, setLanguage] = useState(meeting.language ?? '')
  const [speakers, setSpeakers] = useState(meeting.speakers ?? '')

  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)_32px_32px] items-center gap-x-3 gap-y-2 border-b border-stone-200 py-3 min-[800px]:grid-cols-[20px_minmax(180px,240px)_170px_minmax(180px,240px)_32px_32px] min-[800px]:justify-center min-[800px]:gap-x-4 min-[800px]:gap-y-0 min-[800px]:py-1 dark:border-stone-700">
      <span className="font-ubuntu row-span-2 py-1 text-sm text-stone-500 min-[800px]:row-span-1 min-[800px]:py-3 dark:text-stone-400">
        {index + 1}
      </span>

      <InlineInput
        name={`meetings[${index}][title]`}
        type="text"
        placeholder={t('meetings.uploadDialog.titlePlaceholder')}
        aria-label={`Meeting ${index + 1} title`}
        required
        disabled={isPending}
        defaultValue={meeting.title}
        className={`col-start-2 row-start-1 w-full ${resetPlacementClass}`}
      />

      <div className="col-start-2 row-start-2 grid grid-cols-1 gap-2 min-[800px]:contents">
        <InlineInput
          name={`meetings[${index}][date]`}
          type="date"
          aria-label={`Meeting ${index + 1} date`}
          required
          defaultValue={meeting.date || today}
          max={today}
          disabled={isPending}
          className="w-full"
        />

        <FilePickerInput
          name={`meetings[${index}][file]`}
          accept="audio/*"
          aria-label={`Meeting ${index + 1} audio file`}
          required
          disabled={isPending}
          className="w-full"
        />
      </div>

      <div className={`col-start-3 row-start-1 ${resetPlacementClass}`}>
        <ChevronToggleButton
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(prev => !prev)}
          disabled={isPending}
        />
      </div>

      <div className={`col-start-4 row-start-1 ${resetPlacementClass}`}>
        <RemoveButton
          onClick={() => onRemove(meeting.id)}
          disabled={isPending || meetingsCount === 1}
        />
      </div>

      <MeetingOptionsRow
        index={index}
        language={language}
        speakers={speakers}
        onLanguageChange={setLanguage}
        onSpeakersChange={setSpeakers}
        languages={languages}
        isPending={isPending}
        isExpanded={isExpanded}
      />
    </div>
  )
}
