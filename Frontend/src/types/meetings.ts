export interface Meeting {
  id: string
  title: string
  date: string
  language?: string | null
}

export interface MeetingContentResponse {
  content: string
  title: string
  date: string
}
