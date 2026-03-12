import { useTranslation } from 'react-i18next'

import { useGetMeetings } from '../../api/queries/useMeetingsQueries'
import PageContainer from '../../components/layout/PageContainer'
import Header from '../../components/meetings/Header'
import MeetingsList from '../../components/meetings/list/MeetingList'

export type { Meeting } from '../../types/meetings'

export default function Meetings() {
  const { t } = useTranslation()
  const { data: meetings, isLoading, error } = useGetMeetings()

  let content

  if (isLoading) {
    content = (
      <>
        <span className="font-ubuntu text-lg text-stone-800 dark:text-stone-200">
          {t('meetings.loading')}
        </span>
      </>
    )
  } else if (error) {
    content = (
      <span className="font-ubuntu text-lg text-red-700">
        {t('common.errorPrefix')}
        {error.message}
      </span>
    )
  } else if (!meetings || meetings.length === 0) {
    content = (
      <span className="font-ubuntu text-lg text-stone-800 dark:text-stone-200">
        {t('meetings.noMeetings')}
      </span>
    )
  } else {
    content = <MeetingsList meetings={meetings} />
  }

  return (
    <PageContainer>
      <Header text={t('meetings.title')} />
      <div className="mt-6">{content}</div>
    </PageContainer>
  )
}
