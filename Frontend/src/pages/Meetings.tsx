import { useEffect, useState } from 'react'
import { PropagateLoader } from 'react-spinners'

import MeetingsList from '../components/meetings/MeetingList'
import { useMeetings, useSetMeetings } from '../stores/meetingsStore'

export interface Meeting {
  id: string
  title: string
  date: string
}

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

  let meetingsContent

  if (loading) {
    meetingsContent = (
      <div>
        <span className="font-ubuntu tet-stone-800 text-lg">
          Loading meetings
        </span>
        <PropagateLoader size={30} color="#1D4ED8" />
      </div>
    )
  } else if (error) {
    meetingsContent = (
      <span className="font-ubuntu text-lg text-red-700">Error: {error}</span>
    )
  } else if (meetings.length === 0) {
    meetingsContent = (
      <span className="font-ubuntu text-lg text-stone-800">
        You have not uploaded any meetings yet
      </span>
    )
  } else {
    meetingsContent = <MeetingsList meetings={meetings} />
  }

  return (
    <>
      <h1 className="font-ubuntu text-5xl font-bold text-stone-800 my-8">Meetings</h1>
      {meetingsContent}
    </>
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
