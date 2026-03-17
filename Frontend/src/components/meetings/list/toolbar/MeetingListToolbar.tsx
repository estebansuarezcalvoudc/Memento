import { useTranslation } from 'react-i18next'

import {
  useMeetingListSortOrder,
  type SortOrder,
} from '../../../../stores/meetingListStore'
import Select from '../../../ui/inputs/Select'
import DateFilterToggle from './DateFilterToggle'
import MeetingSearchInput from './MeetingSearchInput'

export default function MeetingListToolbar() {
  const { t } = useTranslation()

  const [sortOrder, setSortOrder] = useMeetingListSortOrder()

  return (
    <div className="flex flex-wrap items-end gap-3">
      <MeetingSearchInput />
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
