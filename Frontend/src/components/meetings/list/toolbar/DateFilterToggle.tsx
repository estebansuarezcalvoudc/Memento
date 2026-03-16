import { useTranslation } from 'react-i18next'

import { calendarFilterImage } from '../../../../assets/buttonsImages'
import {
  useMeetingListHasDateFilter,
  useMeetingListShowDates,
  useToggleMeetingListDates,
} from '../../../../stores/meetingListStore'

export default function DateFilterToggle() {
  const { t } = useTranslation()

  const showDateFilters = useMeetingListShowDates()
  const hasDateFilter = useMeetingListHasDateFilter()
  const toggleDateFilters = useToggleMeetingListDates()

  return (
    <button
      type="button"
      title={t('meetings.list.dateFilterToggle')}
      onClick={toggleDateFilters}
      className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
        hasDateFilter || showDateFilters
          ? 'border-stone-500 bg-stone-200 text-stone-800 dark:border-stone-400 dark:bg-stone-700 dark:text-stone-100'
          : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700 dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-stone-200'
      }`}
    >
      {calendarFilterImage}
      <span className="font-ubuntu">{t('meetings.list.dateFilterToggle')}</span>
      {hasDateFilter && (
        <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-500 text-xs text-white dark:bg-stone-400 dark:text-stone-900">
          •
        </span>
      )}
    </button>
  )
}
