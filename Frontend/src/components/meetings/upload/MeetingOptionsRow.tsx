import { useTranslation } from 'react-i18next'

import { type LanguageOption } from '../../../api/queries/useSettingsQueries'
import InlineInput from '../../ui/inputs/InlineInput'

interface MeetingOptionsRowProps {
  index: number
  language: string
  speakers: string
  onLanguageChange: (value: string) => void
  onSpeakersChange: (value: string) => void
  languages: LanguageOption[]
  isPending: boolean
  isExpanded: boolean
}

export default function MeetingOptionsRow({
  index,
  language,
  speakers,
  onLanguageChange,
  onSpeakersChange,
  languages,
  isPending,
  isExpanded,
}: MeetingOptionsRowProps) {
  const { t } = useTranslation()

  return (
    <div className="[grid-column:1/-1]">
      <input
        type="hidden"
        name={`meetings[${index}][language]`}
        value={language}
      />
      <input
        type="hidden"
        name={`meetings[${index}][speakers]`}
        value={speakers}
      />

      {isExpanded && (
        <div className="flex items-center justify-center gap-6 pb-3">
          <div className="flex items-center gap-2">
            <label className="font-ubuntu shrink-0 text-xs text-stone-400 dark:text-stone-500">
              {t('meetings.uploadDialog.language')}
            </label>
            <select
              value={language}
              onChange={e => onLanguageChange(e.target.value)}
              disabled={isPending}
              aria-label={`Meeting ${index + 1} language`}
              className="font-ubuntu h-7 rounded-lg border border-stone-200 bg-transparent px-2 text-xs text-stone-600 outline-none focus:border-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:focus:border-stone-400"
            >
              <option value="">{t('meetings.uploadDialog.languageAny')}</option>
              {languages.map(l => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-ubuntu shrink-0 text-xs text-stone-400 dark:text-stone-500">
              {t('meetings.uploadDialog.speakers')}
            </label>
            <InlineInput
              type="number"
              min="2"
              value={speakers}
              onChange={e => onSpeakersChange(e.target.value)}
              disabled={isPending}
              aria-label={`Meeting ${index + 1} number of speakers`}
              placeholder="—"
              className="h-7 w-20 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
