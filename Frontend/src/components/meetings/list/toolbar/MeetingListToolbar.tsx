import { useTranslation } from 'react-i18next'

import { listSearchImage } from '../../../../assets/buttonsImages'
import {
  useMeetingListQuery,
  useMeetingListSortOrder,
} from '../../../../stores/meetingListStore'
import Input from '../../../ui/inputs/Input'
import Select from '../../../ui/inputs/Select'
import DateFilterToggle from './DateFilterToggle'

export default function MeetingListToolbar() {
  const { t } = useTranslation()

  const [query, setQuery] = useMeetingListQuery()
  const [sortOrder, setSortOrder] = useMeetingListSortOrder()

  return (
    <div className="flex items-end gap-3">
      <Input
        label={t('meetings.list.searchLabel')}
        type="search"
        placeholder={t('meetings.list.searchPlaceholder')}
        value={query}
        onChange={e => setQuery(e.target.value)}
        containerClassName="flex flex-1 flex-col"
        startIcon={listSearchImage}
        className="pr-3 pl-9"
      />
      <DateFilterToggle />
      <Select
        label={t('meetings.list.sortLabel')}
        value={sortOrder}
        onChange={e => setSortOrder(e.target.value as SortOrder)}
        containerClassName="flex flex-col w-40"
      >
        <option value="date-desc">{t('meetings.list.sortNewestFirst')}</option>
        <option value="date-asc">{t('meetings.list.sortOldestFirst')}</option>
        <option value="title-asc">{t('meetings.list.sortAZ')}</option>
        <option value="title-desc">{t('meetings.list.sortZA')}</option>
      </Select>
    </div>
  )
}
