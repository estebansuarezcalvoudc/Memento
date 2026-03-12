import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { BarLoader } from 'react-spinners'

import CloseNotificationButton from './CloseNotificationButton'

export default function UploadingNotification({
  numberOfMeetings,
  onClose,
}: {
  numberOfMeetings: number
  onClose: () => void
}) {
  const { t } = useTranslation()

  const spanText =
    numberOfMeetings === 1
      ? t('meetings.uploadDialog.notifications.uploadingOne')
      : t('meetings.uploadDialog.notifications.uploadingMany', {
          count: numberOfMeetings,
        })

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 bottom-6 flex items-center gap-3 rounded-lg bg-blue-200 px-4 py-3 text-blue-700 shadow-lg"
    >
      <BarLoader width={80} height={4} aria-hidden="true" color="#1D4ED8" />
      <span>{spanText}</span>
      <CloseNotificationButton onClick={onClose} />
    </div>,
    document.getElementById('notification') as HTMLElement,
  )
}
