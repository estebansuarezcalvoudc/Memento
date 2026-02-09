import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'

import { arrowBack } from '../assets/buttonsImages'
import Header from '../components/meetings/Header'

type ContentType = 'transcription' | 'summary'

interface MeetingContentProps {
  type: ContentType
}

export default function MeetingContent({ type }: MeetingContentProps) {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [content, setContent] = useState('')
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
    const fetchMeetingContent = async () => {
      try {
        const data = await retrieveMeetingContent(config.endpoint, config.dataKey)
        setContent(data)
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
  } else {
    displayContent = <span>{content}</span>
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start p-8">
      <div className="w-fit">
        <div className="mb-6 flex items-center gap-3">
          <NavLink
            to="/meetings"
            className="rounded-full p-2 text-stone-800 hover:bg-blue-200 hover:text-blue-700"
          >
            {arrowBack}
          </NavLink>
          <Header text={config.title} />
          <NavLink
            to={config.otherLink.path}
            className="font-ubuntu text-2xl"
          >
            {config.otherLink.text}
          </NavLink>
        </div>
        {displayContent}
      </div>
    </div>
  )
}

async function retrieveMeetingContent(endpoint: string, dataKey: string) {
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
  return data[dataKey]
}
