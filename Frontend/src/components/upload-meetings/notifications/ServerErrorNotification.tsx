import { createPortal } from 'react-dom'

import CloseNotificationButton from './CloseNotificationButton'

export default function ServerErrorNotification({ onClose }) {
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 bottom-6 flex items-center gap-3 rounded-lg bg-red-200 px-4 py-3 text-red-700 shadow-lg"
    >
      <span className="whitespace-pre-line">
        Could not upload meetings
        <br />
        Network error or server unavailable
      </span>
      <CloseNotificationButton onClick={onClose} />
    </div>,
    document.getElementById('notification') as HTMLElement,
  )
}
