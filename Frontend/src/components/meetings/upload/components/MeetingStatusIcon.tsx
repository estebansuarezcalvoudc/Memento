import { type MeetingProcessingStatus } from '../../../../api/meetings/useUploadMeetings'
import {
  check,
  clockPause,
  faceError,
} from '../../../../assets/meetingUploadProgress'

interface MeetingStatusIconProps {
  status: MeetingProcessingStatus | null
}

export default function MeetingStatusIcon({ status }: MeetingStatusIconProps) {
  switch (status) {
    case null:
      return (
        <span
          role="img"
          aria-label="Not processed"
          className="text-stone-400 dark:text-stone-500"
        >
          <span aria-hidden="true">-</span>
        </span>
      )
    case 'processing':
      return (
        <span role="img" aria-label="Processing">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-blue-500"
            aria-hidden="true"
          />
        </span>
      )
    case 'succeeded':
      return (
        <span
          role="img"
          aria-label="Processed successfully"
          className="text-emerald-600 dark:text-emerald-400"
        >
          <span aria-hidden="true">{check}</span>
        </span>
      )
    case 'failed':
      return (
        <span
          role="img"
          aria-label="Processing failed"
          className="text-red-600 dark:text-red-400"
        >
          <span aria-hidden="true">{faceError}</span>
        </span>
      )
    case 'waiting':
      return (
        <span
          role="img"
          aria-label="Waiting"
          className="text-stone-400 dark:text-stone-500"
        >
          <span aria-hidden="true">{clockPause}</span>
        </span>
      )
    default:
      return null
  }
}
