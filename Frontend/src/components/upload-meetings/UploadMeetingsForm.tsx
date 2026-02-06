import { useActionState, useEffect, useState } from 'react'

import {
  parseMeetingsFromFormData,
  type MeetingMetadata,
} from '../../utils/upload-meetings/parseMeetingsFormData'
import AddMeetingButton from './AddMeetingButton'
import MeetingForm from './MeetingForm'
import ServerErrorNotification from './notifications/ServerErrorNotification'
import SuccessNotification from './notifications/SuccessNotification'
import UploadingNotification from './notifications/UploadingNotification'
import UploadMeetingsButton from './UploadMeetingsButton'

interface Meeting {
  id: string
  title: string
}

interface FormState {
  validationErrors: null | string[]
  serverError?: boolean
  uploadedMeetingsCount?: number
  success?: boolean
}

async function uploadMeetingsAction(
  _prevFormState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseMeetingsFromFormData(formData)

  if (!parsed.ok) {
    return { validationErrors: parsed.errors }
  }

  const uploadResult = await processUploadMeetings(
    parsed.meetingsMetadata,
    parsed.audioFiles,
  )

  return uploadResult
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
      return { validationErrors: null, serverError: true, success: false }
    }

    return {
      success: true,
      validationErrors: null,
      uploadedMeetingsCount: meetingsMetadata.length,
    }
  } catch {
    return { validationErrors: null, serverError: true, success: false }
  }
}

function createMeeting(): Meeting {
  return {
    id: crypto.randomUUID(),
    title: '',
  }
}

type Notification = 'none' | 'uploading' | 'success' | 'serverError'

export default function UploadMeetingsForm({
  handleCloseDialog,
}: {
  handleCloseDialog: () => void
}) {
  const [meetings, setMeetings] = useState<Meeting[]>([createMeeting()])

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(uploadMeetingsAction, { validationErrors: null })

  const [notification, setNotification] = useState<Notification>('none')

  useEffect(() => {
    if (isPending) {
      setNotification('uploading')
    } else if (formState.success) {
      setNotification('success')
      handleCloseDialog()
    } else if (formState.serverError) {
      setNotification('serverError')
    }
  }, [isPending, formState.success, formState.serverError, handleCloseDialog])

  const handleSubmit = (formData: FormData) => {
    formAction(formData)
  }

  const addMeeting = () => setMeetings(prev => [...prev, createMeeting()])

  const removeMeeting = (id: string) => {
    setMeetings(prev =>
      prev.length > 1 ? prev.filter(m => m.id !== id) : prev,
    )
  }

  const closeNotification = () => {
    setNotification('none')
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

      {notification === 'uploading' && (
        <UploadingNotification
          numberOfMeetings={meetings.length}
          onClose={closeNotification}
        />
      )}

      {notification === 'success' && (
        <SuccessNotification
          numberOfMeetings={formState.uploadedMeetingsCount as number}
          onClose={closeNotification}
        />
      )}

      {notification === 'serverError' && (
        <ServerErrorNotification onClose={closeNotification} />
      )}

      <div className="mt-5 mb-4 flex justify-center gap-4">
        <AddMeetingButton onClick={addMeeting} isPending={isPending} />
        <UploadMeetingsButton isPending={isPending} />
      </div>
    </form>
  )
}
