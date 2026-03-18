export interface JobStartedEvent {
  type: 'JobStarted'
  totalMeetings: number
}

export interface MeetingProcessingStartedEvent {
  type: 'MeetingProcessingStarted'
  index: number
  title: string
}

export interface MeetingProcessingSucceededEvent {
  type: 'MeetingProcessingSucceeded'
  index: number
  title: string
  meetingId: string
}

export interface MeetingProcessingFailedEvent {
  type: 'MeetingProcessingFailed'
  index: number
  title: string
  error: string
}

export interface MeetingProcessingErrorEvent {
  type: 'MeetingProcessingError'
  index: number
  title: string
  error: string
}

export interface JobFinishedEvent {
  type: 'JobFinished'
  meetingsSucceeded: number
  meetingsFailed: number
}

export type MeetingUploadEvent =
  | JobStartedEvent
  | MeetingProcessingStartedEvent
  | MeetingProcessingSucceededEvent
  | MeetingProcessingFailedEvent
  | MeetingProcessingErrorEvent
  | JobFinishedEvent
