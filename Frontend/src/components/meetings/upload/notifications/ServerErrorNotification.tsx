import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import CloseNotificationButton from './CloseNotificationButton'

export default function ServerErrorNotification({
  onClose,
}: {
  onClose: () => void
}) {
  const { t } = useTranslation()

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed right-6 bottom-6 flex items-center gap-3 rounded-lg bg-red-200 px-4 py-3 text-red-800 shadow-lg"
    >
      <span className="whitespace-pre-line">
        {t('meetings.uploadDialog.notifications.serverError')}
        <br />
        {t('meetings.uploadDialog.notifications.serverErrorDetail')}
      </span>
      <CloseNotificationButton onClick={onClose} />
    </div>,
    document.getElementById('notification') as HTMLElement,
  )
}
