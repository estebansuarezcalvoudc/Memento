import { useCallback, useEffect, useState } from 'react'

type NotificationType = 'uploading' | 'success' | 'error'
export type ToastState = {
  id: string
  type: NotificationType
  message: string
} | null

export function useUploadMeetingsToast(
  isPending: boolean,
  meetingsLen: number,
  serverError?: boolean,
  success?: boolean,
  uploadedCount?: number,
) {
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(() => {
    if (isPending) {
      setToast({
        id: crypto.randomUUID(),
        type: 'uploading',
        message: `Uploading ${meetingsLen} ${meetingsLen === 1 ? 'meeting' : 'meetings'}...`,
      })
      return
    }

    if (serverError) {
      setToast({
        id: crypto.randomUUID(),
        type: 'error',
        message:
          'Could not upload meetings\nNetwork error or server unavailable',
      })
      return
    }

    if (success) {
      const count = uploadedCount ?? 0
      setToast({
        id: crypto.randomUUID(),
        type: 'success',
        message: `${count} ${count === 1 ? 'meeting has' : 'meetings have'} been uploaded`,
      })
    }
  }, [isPending, meetingsLen, serverError, success, uploadedCount])

  const closeToast = useCallback(() => setToast(null), [])

  return { toast, closeToast, setToast }
}
