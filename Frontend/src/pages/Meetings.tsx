import { useMeetingsQuery } from '../api/useMeetingsQuery'
import PageContainer from '../components/layout/PageContainer'
import Header from '../components/meetings/Header'
import MeetingsList from '../components/meetings/MeetingList'

export type { Meeting } from '../api/useMeetingsQuery'

export default function Meetings() {
  const { data: meetings, isLoading, isError } = useMeetingsQuery()

  let content

  if (isLoading) {
    content = (
      <>
        <span className="font-ubuntu text-lg text-stone-800">
          Loading meetings
        </span>
      </>
    )
  } else if (isError) {
    content = (
      <span className="font-ubuntu text-lg text-red-700">Error: Failed to fetch meetings</span>
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
