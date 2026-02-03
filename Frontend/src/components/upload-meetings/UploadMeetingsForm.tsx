import { useActionState, useEffect, useState } from 'react'

import { useUploadMeetingsToast } from '../../hooks/upload-meetings/useUploadMeetingsToast'
import { parseMeetingsFromFormData } from '../../utils/upload-meetings/parseMeetingsFormData'
import AddMeetingButton from './AddMeetingButton'
import MeetingForm from './MeetingForm'
import Notification from './Notification'
import UploadMeetingsButton from './UploadMeetingsButton'

interface Meeting {
  id: string
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

async function uploadMeetingsAction(
  _prevFormState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const parsed = parseMeetingsFromFormData(formData)
    if (!parsed.ok) {
      return { errors: parsed.errors }
    }

    return await processUploadMeetings(
      parsed.meetingsMetadata,
      parsed.audioFiles,
    )
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

function createMeeting(): Meeting {
  return {
    id: crypto.randomUUID(),
    title: '',
  }
}

export default function UploadMeetingsForm({
  onClose,
}: {
  onClose: () => void
}) {
  const [meetings, setMeetings] = useState<Meeting[]>([createMeeting()])
  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(uploadMeetingsAction, { errors: null })

  useEffect(() => {
    if (formState.success) {
      setMeetings([createMeeting()])
    }
  }, [formState.success])

  const { toast, closeToast } = useUploadMeetingsToast(
    isPending,
    meetings.length,
    formState.serverError,
    formState.success,
    formState.meetingsCount,
  )

  const handleSubmit = (formData: FormData) => {
    onClose()
    formAction(formData)
  }

  const addMeeting = () => {
    setMeetings(prev => [...prev, createMeeting()])
  }

  const removeMeeting = (id: string) => {
    if (meetings.length > 1) {
      setMeetings(prev => prev.filter(meeting => meeting.id !== id))
    }
  }

  return (
    <form action={handleSubmit}>
      {meetings.map((meeting, i) => (
        <MeetingForm
          key={meeting.id}
          meeting={meeting}
          index={i}
          meetingsCount={meetings.length}
          isPending={isPending}
          onRemove={removeMeeting}
        />
      ))}

      {formState.errors && (
        <div className="mt-4 rounded-lg bg-red-100 p-3">
          {formState.errors.map((error, i) => (
            <p key={i} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      {toast && (
        <Notification
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
        />
      )}

      <div className="mt-5 mb-4 flex justify-center gap-4">
        <AddMeetingButton onClick={addMeeting} isPending={isPending} />
        <UploadMeetingsButton isPending={isPending} />
      </div>
    </form>
  )
}
