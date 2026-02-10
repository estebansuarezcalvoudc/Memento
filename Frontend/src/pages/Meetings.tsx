import { useEffect, useState } from 'react'

import PageContainer from '../components/layout/PageContainer'
import Header from '../components/meetings/Header'
import MeetingsList from '../components/meetings/MeetingList'
import { useMeetings, useSetMeetings } from '../stores/meetingsStore'

export type { Meeting } from '../stores/meetingsStore'

export default function Meetings() {
  const meetings = useMeetings()
  const setMeetings = useSetMeetings()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await retrieveMeetings()
        setMeetings(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch meetings',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [setMeetings])

  let content

  if (loading) {
    content = (
      <>
        <span className="font-ubuntu text-lg text-stone-800">
          Loading meetings
        </span>
      </>
    )
  } else if (error) {
    content = (
      <span className="font-ubuntu text-lg text-red-700">Error: {error}</span>
    )
  } else if (meetings.length === 0) {
    content = (
      <span className="font-ubuntu text-lg text-stone-800">
        You have not uploaded any meetings yet
      </span>
    )
  } else {
    content = <MeetingsList meetings={meetings} />
  }

  return (
    <PageContainer>
      <Header text="Meetings" />
      <div className="mt-6">{content}</div>
    </PageContainer>
  )
}

async function retrieveMeetings() {
  const token = localStorage.getItem('access_token')

  if (!token) {
    throw new Error('No access token found')
  }

  const response = await fetch('/api/meetings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}
