import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BarLoader } from 'react-spinners'

import { closeImage } from '../assets/buttonsImages'

type NotificationType = 'uploading' | 'success' | 'error'

interface NotificationProps {
  type: NotificationType
  message: string
  onClose: () => void
}

export default function Notification({
  type,
  message,
  onClose,
}: NotificationProps) {
  const isError = type === 'error'

  useEffect(() => {
    if (type === 'uploading') return

    const timer = setTimeout(() => onClose(), 6000)
    return () => clearTimeout(timer)
  }, [type, onClose])

  return createPortal(
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`fixed right-6 bottom-6 z-[9999] flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${type === 'uploading' ? 'bg-blue-200 text-blue-700' : ''} ${type === 'success' ? 'bg-green-200 text-green-700' : ''} ${type === 'error' ? 'bg-red-200 text-red-700' : ''}`}
    >
      {type === 'uploading' && (
        <BarLoader width={80} height={4} aria-hidden="true" color="blue" />
      )}

      <span className="text-sm whitespace-pre-line">{message}</span>

      <button
        onClick={onClose}
        className="ml-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10"
        aria-label="Close notification"
      >
        <div className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{closeImage}</div>
      </button>
    </div>,
    document.getElementById('notification') as HTMLElement,
  )
}
