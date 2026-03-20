import { ClipLoader } from 'react-spinners'

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
        <span role="img" aria-label="Processing" className="text-blue-500">
          <ClipLoader size={14} color="currentColor" />
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
