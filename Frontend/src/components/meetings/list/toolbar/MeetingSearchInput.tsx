import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import {
  cancelSearchImage,
  listSearchImage,
} from '../../../../assets/buttonsImages'
import { useMeetingListQuery } from '../../../../stores/meetingListStore'

export default function MeetingSearchInput() {
  const id = useId()
  const [query, setQuery] = useMeetingListQuery()

  const { t } = useTranslation()

  return (
    <div className="group relative flex-1">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-stone-400 dark:text-stone-500">
        <span className="scale-90">{listSearchImage}</span>
      </span>

      <input
        id={id}
        type="text"
        placeholder={t('meetings.list.searchPlaceholder')}
        className="font-ubuntu h-8 w-full rounded-lg border border-stone-300 bg-transparent pr-9 pl-9 text-base text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus:border-stone-400"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      <button
        type="button"
        className="absolute top-1/2 right-2 -translate-y-1/2 text-stone-400 transition-all hover:text-stone-600 disabled:hidden dark:hover:text-stone-200"
        disabled={query === ''}
        onClick={() => setQuery('')}
      >
        <div className="scale-85">{cancelSearchImage}</div>
      </button>
    </div>
  )
}
