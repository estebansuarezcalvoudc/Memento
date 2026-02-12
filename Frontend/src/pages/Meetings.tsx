import { useEffect, useState } from 'react'

import useMeetingsAPI from '../api/useMeetingsAPI'
import PageContainer from '../components/layout/PageContainer'
import Header from '../components/meetings/Header'
import MeetingsList from '../components/meetings/MeetingList'
import { useMeetings, useSetMeetings } from '../stores/meetingsStore'

export type { Meeting } from '../stores/meetingsStore'

export default function Meetings() {
  const meetings = useMeetings()
  const setMeetings = useSetMeetings()

  const { getAllMeetings } = useMeetingsAPI()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getAllMeetings()
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
  }, [getAllMeetings, setMeetings])

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
