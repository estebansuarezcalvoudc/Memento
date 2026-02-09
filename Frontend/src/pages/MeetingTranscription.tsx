import { useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'

import { arrowBack } from '../assets/buttonsImages'
import Header from '../components/meetings/Header'

export default function MeetingTranscription() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMeetingTranscription = async () => {
      try {
        const data = await retrieveMeetingTranscription(meetingId)
        setTranscription(data)
      } catch (error) {
        setError(`Failed to fetch transcription: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetingTranscription()
  }, [meetingId])

  let content

  if (loading) {
    content = (
      <>
        <span className="font-ubuntu text-lg text-stone-800">
          Loading transcription
        </span>
      </>
    )
  } else if (error) {
    content = (
      <span className="font-ubuntu text-lg text-red-700">Error: {error}</span>
    )
  } else {
    content = <span>{transcription}</span>
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
          <h1 className="font-ubuntu text-4xl font-bold text-stone-800">
            Transcription
          </h1>
        </div>
        {content}
      </div>
    </div>
  )
}

async function retrieveMeetingTranscription(meetingId: string) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('No access token found')
  }

  const response = await fetch(`/api/meetings/transcription/${meetingId}`, {
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
  return data.transcription
}
