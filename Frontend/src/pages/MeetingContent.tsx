import { NavLink, useParams } from 'react-router-dom'

import { arrowBack } from '../assets/buttonsImages'
import PageContainer from '../components/layout/PageContainer'
import Header from '../components/meetings/Header'
import {
  useGetMeetingSummary,
  useGetMeetingTranscription,
} from '../hooks/useMeetingsQueries'
import MeetingSummary from './MeetingSummary'
import MeetingTranscription from './MeetingTranscription'

type ContentType = 'transcription' | 'summary'

interface MeetingContentProps {
  type: ContentType
}

export default function MeetingContent({ type }: MeetingContentProps) {
  const { meetingId } = useParams<{ meetingId: string }>()

  const summaryQuery = useGetMeetingSummary(
    type === 'summary' ? meetingId : undefined,
  )
  const transcriptionQuery = useGetMeetingTranscription(
    type === 'transcription' ? meetingId : undefined,
  )

  const config = {
    summary: {
      title: 'Summary',
      loadingText: 'Loading Summary',
      errorLabel: 'Failed to fetch summary',
      query: summaryQuery,
      otherLink: { text: 'Transcription', path: `/meetings/${meetingId}/transcription` },
      renderContent: (content: string) => <MeetingSummary content={content} />,
    },
    transcription: {
      title: 'Transcription',
      loadingText: 'Loading transcription',
      errorLabel: 'Failed to fetch transcription',
      query: transcriptionQuery,
      otherLink: { text: 'Summary', path: `/meetings/${meetingId}/summary` },
      renderContent: (content: string) => <MeetingTranscription content={content} />,
    },
  }[type]

  const { title, loadingText, errorLabel, query, otherLink, renderContent } = config

  let displayContent

  if (query.isLoading) {
    displayContent = (
      <span className="font-ubuntu text-lg text-stone-800">{loadingText}</span>
    )
  } else if (query.error) {
    displayContent = (
      <span className="font-ubuntu text-lg text-red-700">
        Error: {errorLabel}: {query.error.message}
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
            className="rounded-full p-2 text-stone-800 hover:bg-blue-200 hover:text-blue-700"
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
        <div className="font-ubuntu mb-8 text-2xl text-stone-600">
          {query.data.title} - {query.data.date}
        </div>
      )}
      {displayContent}
    </PageContainer>
  )
}
