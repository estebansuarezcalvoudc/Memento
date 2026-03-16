import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type LanguageOption } from '../../../api/queries/useSettingsQueries'
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

export const meetingFormGridCols = 'grid-cols-[20px_1fr_170px_1fr_32px_32px]'

export default function MeetingForm({
  meeting,
  index,
  meetingsCount,
  isPending,
  onRemove,
  languages,
}: MeetingFormProps) {
  const { t } = useTranslation()
  const today = new Date().toISOString().split('T')[0]
  const [isExpanded, setIsExpanded] = useState(false)
  const [language, setLanguage] = useState(meeting.language ?? '')
  const [speakers, setSpeakers] = useState(meeting.speakers ?? '')

  return (
    <div
      className={`grid ${meetingFormGridCols} items-center gap-x-4 border-b border-stone-200 py-1 dark:border-stone-700`}
    >
      <span className="font-ubuntu py-3 text-sm text-stone-500 dark:text-stone-400">
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
        className="w-full"
      />

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

      <InlineInput
        name={`meetings[${index}][file]`}
        type="file"
        accept="audio/*"
        aria-label={`Meeting ${index + 1} audio file`}
        required
        disabled={isPending}
        className="w-full"
      />

      <ChevronToggleButton
        isExpanded={isExpanded}
        onClick={() => setIsExpanded(prev => !prev)}
        disabled={isPending}
      />

      <RemoveButton
        onClick={() => onRemove(meeting.id)}
        disabled={isPending || meetingsCount === 1}
      />

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
