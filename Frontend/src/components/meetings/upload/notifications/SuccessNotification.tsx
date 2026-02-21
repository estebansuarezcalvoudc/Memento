import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import CloseNotificationButton from './CloseNotificationButton'

export default function SuccessNotification({
  numberOfMeetings,
  onClose,
}: {
  numberOfMeetings: number
  onClose: () => void
}) {
  useEffect(() => {
    const timeout = setTimeout(() => onClose(), 6000)
    return () => clearTimeout(timeout)
  }, [onClose])

  const spanText =
    numberOfMeetings == 1
      ? '1 meeting has been uploaded'
      : `${numberOfMeetings} meetings have been uploaded`

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 bottom-6 flex items-center gap-3 rounded-lg bg-green-200 px-4 py-3 text-green-800 shadow-lg"
    >
      <span>{spanText}</span>
      <CloseNotificationButton onClick={onClose} />
    </div>,
    document.getElementById('notification') as HTMLElement,
  )
}
