import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'

import { arrowBack } from '../assets/buttonsImages'
import PageContainer from '../components/layout/PageContainer'
import Header from '../components/meetings/Header'
import MeetingSummary from './MeetingSummary'
import MeetingTranscription from './MeetingTranscription'

type ContentType = 'transcription' | 'summary'

interface MeetingContentProps {
  type: ContentType
}

interface MeetingData {
  content: string
  title: string
  date: string
}

export default function MeetingContent({ type }: MeetingContentProps) {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const config = {
    transcription: {
      title: 'Transcription',
      loadingText: 'Loading transcription',
      errorText: 'Failed to fetch transcription',
      endpoint: `/api/meetings/transcription/${meetingId}`,
      dataKey: 'transcription',
      otherLink: {
        text: 'Summary',
        path: `/meetings/${meetingId}/summary`,
      },
    },
    summary: {
      title: 'Summary',
      loadingText: 'Loading Summary',
      errorText: 'Failed to fetch summary',
      endpoint: `/api/meetings/summary/${meetingId}`,
      dataKey: 'summary',
      otherLink: {
        text: 'Transcription',
        path: `/meetings/${meetingId}/transcription`,
      },
    },
  }[type]

  useEffect(() => {
    // Reset state when changing content type
    setLoading(true)
    setMeetingData(null)
    setError('')
    
    const fetchMeetingContent = async () => {
      try {
        const data = await retrieveMeetingContent(
          config.endpoint,
          config.dataKey,
        )
        setMeetingData(data)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        setError(`${config.errorText}: ${message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetingContent()
  }, [meetingId, config.endpoint, config.dataKey, config.errorText])

  let displayContent

  if (loading) {
    displayContent = (
      <span className="font-ubuntu text-lg text-stone-800">
        {config.loadingText}
      </span>
    )
  } else if (error) {
    displayContent = (
      <span className="font-ubuntu text-lg text-red-700">Error: {error}</span>
    )
  } else if (meetingData) {
    if (type === 'summary') {
      displayContent = <MeetingSummary content={meetingData.content} />
    } else {
      displayContent = <MeetingTranscription content={meetingData.content} />
    }
  } else {
    displayContent = null
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
          <Header text={config.title} />
        </div>
        <NavLink 
          to={config.otherLink.path} 
          className="font-ubuntu text-xl bg-lime-400 px-4 py-2 rounded-xl text-stone-800 hover:bg-lime-500"
        >
          {config.otherLink.text}
        </NavLink>
      </div>
      {meetingData && (
        <div className="mb-8 font-ubuntu text-2xl text-stone-600">
          {meetingData.title} - {meetingData.date}
        </div>
      )}
      {displayContent}
    </PageContainer>
  )
}

async function retrieveMeetingContent(
  endpoint: string,
  dataKey: string,
): Promise<MeetingData> {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('No access token found')
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data[dataKey],
    title: data.title,
    date: data.date,
  }
}
