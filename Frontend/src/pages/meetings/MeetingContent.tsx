import { useTranslation } from 'react-i18next'
import { NavLink, useParams } from 'react-router-dom'

import {
  useGetMeetingSummary,
  useGetMeetingTranscription,
} from '../../api/queries/useMeetingsQueries'
import { arrowBack } from '../../assets/buttonsImages'
import PageContainer from '../../components/layout/PageContainer'
import MeetingSummary from '../../components/meetings/content/MeetingSummary'
import MeetingTranscription from '../../components/meetings/content/MeetingTranscription'
import Header from '../../components/meetings/Header'

type ContentType = 'transcription' | 'summary'

interface MeetingContentProps {
  type: ContentType
}

export default function MeetingContent({ type }: MeetingContentProps) {
  const { t } = useTranslation()
  const { meetingId } = useParams<{ meetingId: string }>()

  const summaryQuery = useGetMeetingSummary(
    type === 'summary' ? meetingId : undefined,
  )
  const transcriptionQuery = useGetMeetingTranscription(
    type === 'transcription' ? meetingId : undefined,
  )

  const config = {
    summary: {
      title: t('meetings.content.summary'),
      loadingText: t('meetings.content.loadingSummary'),
      errorLabel: t('meetings.content.errorSummary'),
      query: summaryQuery,
      otherLink: {
        text: t('meetings.content.transcription'),
        path: `/meetings/${meetingId}/transcription`,
      },
      renderContent: (content: string) => <MeetingSummary content={content} />,
    },
    transcription: {
      title: t('meetings.content.transcription'),
      loadingText: t('meetings.content.loadingTranscription'),
      errorLabel: t('meetings.content.errorTranscription'),
      query: transcriptionQuery,
      otherLink: {
        text: t('meetings.content.summary'),
        path: `/meetings/${meetingId}/summary`,
      },
      renderContent: (content: string) => (
        <MeetingTranscription content={content} />
      ),
    },
  }[type]

  const { title, loadingText, errorLabel, query, otherLink, renderContent } =
    config

  let displayContent

  if (query.isLoading) {
    displayContent = (
      <span className="font-ubuntu text-lg text-stone-800 dark:text-stone-200">
        {loadingText}
      </span>
    )
  } else if (query.error) {
    displayContent = (
      <span className="font-ubuntu text-lg text-red-700">
        {t('meetings.content.errorPrefix')}
        {errorLabel}: {query.error.message}
      </span>
    )
  } else if (query.data) {
    displayContent = renderContent(query.data.content)
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <NavLink
            to="/meetings"
            className="rounded-full p-2 text-stone-800 hover:bg-blue-200 hover:text-blue-700 dark:text-stone-200 dark:hover:bg-blue-900 dark:hover:text-blue-300"
          >
            {arrowBack}
          </NavLink>
          <Header text={title} />
        </div>
        <NavLink
          to={otherLink.path}
          className="font-ubuntu rounded-xl bg-lime-400 px-4 py-2 text-xl text-stone-800 hover:bg-lime-500"
        >
          {otherLink.text}
        </NavLink>
      </div>
      {query.data && (
        <div className="font-ubuntu mb-8 text-2xl text-stone-600 dark:text-stone-400">
          {query.data.title} - {query.data.date}
        </div>
      )}
      {displayContent}
    </PageContainer>
  )
}
