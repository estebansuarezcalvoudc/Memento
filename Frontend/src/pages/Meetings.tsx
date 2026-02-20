import PageContainer from '../components/layout/PageContainer'
import Header from '../components/meetings/Header'
import MeetingsList from '../components/meetings/MeetingList'
import { useGetMeetings } from '../hooks/useMeetingsQueries'

export type { Meeting } from '../types/meetings'

export default function Meetings() {
  const { data: meetings, isLoading, error } = useGetMeetings()

  let content

  if (isLoading) {
    content = (
      <>
        <span className="font-ubuntu text-lg text-stone-800">
          Loading meetings
        </span>
      </>
    )
  } else if (error) {
    content = (
      <span className="font-ubuntu text-lg text-red-700">
        Error: {error.message}
      </span>
    )
  } else if (!meetings || meetings.length === 0) {
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
