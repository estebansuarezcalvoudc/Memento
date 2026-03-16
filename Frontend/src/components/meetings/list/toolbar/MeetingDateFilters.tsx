import { useTranslation } from 'react-i18next'

import {
  useClearMeetingListDates,
  useMeetingListDateFrom,
  useMeetingListDateTo,
  useMeetingListHasDateFilter,
  useMeetingListShowDates,
} from '../../../../stores/meetingListStore'
import { localDateString } from '../../../../utils/date'
import DangerButton from '../../../ui/buttons/DangerButton'
import Input from '../../../ui/inputs/Input'

const today = localDateString()

export default function MeetingDateFilters() {
  const { t } = useTranslation()

  const showDateFilters = useMeetingListShowDates()
  const [dateFrom, setDateFrom] = useMeetingListDateFrom()
  const [dateTo, setDateTo] = useMeetingListDateTo()
  const hasDateFilter = useMeetingListHasDateFilter()

  const clearDates = useClearMeetingListDates()

  if (!showDateFilters) {
    return null
  }

  return (
    <div className="flex items-end gap-3">
      <Input
        label={t('meetings.list.fromLabel')}
        type="date"
        value={dateFrom}
        max={today}
        onChange={e => setDateFrom(e.target.value)}
        containerClassName="flex flex-col w-40"
      />
      <Input
        label={t('meetings.list.toLabel')}
        type="date"
        value={dateTo}
        max={today}
        onChange={e => setDateTo(e.target.value)}
        containerClassName="flex flex-col w-40"
      />
      <DangerButton disabled={!hasDateFilter} onClick={clearDates}>
        {t('meetings.list.clearDates')}
      </DangerButton>
    </div>
  )
}
