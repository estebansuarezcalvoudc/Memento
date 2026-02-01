import { useActionState, useEffect, useState } from 'react'

import Notification from '../../notifications/Notification'
import Input from './Input'

interface Meeting {
  title: string
  audioFile?: File
  meetingDate?: string
  language?: string
  speakers?: number
}

interface FormState {
  errors: null | string[]
  serverError?: boolean
  success?: boolean
  meetingsCount?: number
}

interface MeetingMetadata {
  title: string
  date: string
  language?: string
  number_of_speakers?: number
}

type NotificationType = 'uploading' | 'success' | 'error'

type ToastState =
  | { id: string; type: NotificationType; message: string }
  | null

async function uploadMeetingsAction(
  _prevFormState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const audioFiles: File[] = []
    const meetingsMetadata: MeetingMetadata[] = []

    let meetingIndex = 0
    while (formData.has(`meetings[${meetingIndex}][title]`)) {
      const title = formData.get(`meetings[${meetingIndex}][title]`) as string
      const date = formData.get(`meetings[${meetingIndex}][date]`) as string
      const language = formData.get(`meetings[${meetingIndex}][language]`) as string
      const speakers = formData.get(`meetings[${meetingIndex}][speakers]`) as string
      const audioFile = formData.get(`meetings[${meetingIndex}][file]`) as File

      if (!title || title.trim() === '') {
        return { errors: [`Meeting ${meetingIndex + 1}: Title is required`] }
      }

      if (!date) {
        return { errors: [`Meeting ${meetingIndex + 1}: Date is required`] }
      }

      if (!audioFile || audioFile.size === 0) {
        return { errors: [`Meeting ${meetingIndex + 1}: Audio file is required`] }
      }

      const metadata: MeetingMetadata = {
        title: title.trim(),
        date,
      }

      if (language?.trim()) {
        metadata.language = language.trim()
      }

      if (speakers?.trim()) {
        const speakersNum = parseInt(speakers)
        if (!isNaN(speakersNum) && speakersNum >= 2) {
          metadata.number_of_speakers = speakersNum
        }
      }

      meetingsMetadata.push(metadata)
      audioFiles.push(audioFile)
      meetingIndex++
    }

    if (meetingsMetadata.length === 0) {
      return { errors: ['You must add at least one meeting'] }
    }

    return await processUploadMeetings(meetingsMetadata, audioFiles)
  } catch (error) {
    console.error('Error in uploadMeetingsAction:', error)
    return { errors: ['An unexpected error occurred'] }
  }
}

async function processUploadMeetings(
  meetingsMetadata: MeetingMetadata[],
  audioFiles: File[],
): Promise<FormState> {
  try {
    const backendFormData = new FormData()
    backendFormData.append(
      'meetings_data',
      JSON.stringify({ meetings_metadata: meetingsMetadata }),
    )

    audioFiles.forEach(file => backendFormData.append('audios', file))

    const token = localStorage.getItem('access_token')

    const response = await fetch('/api/meetings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: backendFormData,
    })

    if (!response.ok) {
      return { errors: null, serverError: true }
    }

    return {
      errors: null,
      success: true,
      meetingsCount: meetingsMetadata.length,
    }
  } catch (error) {
    console.error('Error in processUploadMeetings:', error)
    return { errors: null, serverError: true }
  }
}

export default function UploadMeetingsForm({ onClose }: { onClose: () => void }) {
  const [meetings, setMeetings] = useState<Meeting[]>([{ title: '' }])
  const [toast, setToast] = useState<ToastState>(null)

  const [formState, formAction, isPending] = useActionState<FormState, FormData>(
    uploadMeetingsAction,
    { errors: null },
  )

  // Reset meetings on success
  useEffect(() => {
    if (formState.success) {
      setMeetings([{ title: '' }])
    }
  }, [formState.success])

  // Handle notifications
  useEffect(() => {
    if (isPending) {
      setToast({
        id: crypto.randomUUID(),
        type: 'uploading',
        message: `Uploading ${meetings.length} ${
          meetings.length === 1 ? 'meeting' : 'meetings'
        }...`,
      })
      return
    }

    if (formState.serverError) {
      setToast({
        id: crypto.randomUUID(),
        type: 'error',
        message: 'Could not upload meetings\nNetwork error or server unavailable',
      })
      return
    }

    if (formState.success) {
      setToast({
        id: crypto.randomUUID(),
        type: 'success',
        message: `${formState.meetingsCount} ${
          formState.meetingsCount === 1 ? 'meeting has' : 'meetings have'
        } been uploaded`,
      })
    }
  }, [
    isPending,
    formState.serverError,
    formState.success,
    formState.meetingsCount,
    meetings.length,
  ])

  // Auto-dismiss success & error toasts
  useEffect(() => {
    if (!toast || toast.type === 'uploading') return

    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSubmit = (formData: FormData) => {
    onClose()
    formAction(formData)
  }

  const addMeeting = () => {
    setMeetings(prev => [...prev, { title: '' }])
  }

  const removeMeeting = (index: number) => {
    if (meetings.length > 1) {
      setMeetings(prev => prev.filter((_, i) => i !== index))
    }
  }

  return (
    <form action={handleSubmit}>
      {meetings.map((_, i) => (
        <div
          key={i}
          className="mt-4 rounded-2xl border-2 border-dotted border-stone-400 bg-stone-100 p-3"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-ubuntu text-lg text-stone-700">
              Meeting {i + 1}
            </span>

            {meetings.length > 1 && (
              <button
                type="button"
                onClick={() => removeMeeting(i)}
                disabled={isPending}
                className="cursor-pointer rounded-xl p-2 text-stone-700 hover:bg-stone-300"
              >
                {removeMeetingImage}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Title"
              name={`meetings[${i}][title]`}
              type="text"
              required
              disabled={isPending}
            />

            <Input
              label="Date"
              name={`meetings[${i}][date]`}
              type="date"
              required
              disabled={isPending}
            />

            <Input
              label="Language (optional)"
              name={`meetings[${i}][language]`}
              type="text"
              disabled={isPending}
            />

            <Input
              label="Number of speakers (optional)"
              name={`meetings[${i}][speakers]`}
              type="number"
              min="2"
              disabled={isPending}
            />

            <Input
              label="Audio File"
              name={`meetings[${i}][file]`}
              type="file"
              accept="audio/*"
              required
              disabled={isPending}
            />
          </div>
        </div>
      ))}

      {formState.errors && (
        <div className="mt-4 rounded-lg bg-red-100 p-3">
          {formState.errors.map((error, i) => (
            <p key={i} className="text-sm text-red-700">❌ {error}</p>
          ))}
        </div>
      )}

      {toast && (
        <Notification
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mt-5 mb-4 flex justify-center gap-4">
        <button
          type="button"
          onClick={addMeeting}
          disabled={isPending}
          className="rounded-lg bg-stone-200 px-2 py-1.5 text-stone-700 disabled:opacity-50"
        >
          + Add meeting
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-400 px-2 py-1.5 text-stone-800 disabled:opacity-50"
        >
          {isPending ? 'Uploading...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}

const removeMeetingImage = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 7h16" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    <path d="M10 12l4 4m0 -4l-4 4" />
  </svg>
)

