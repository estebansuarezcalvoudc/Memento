import { useActionState, useEffect, useState } from 'react'

import {
  useAddMeeting,
  type Meeting as StoreMeeting,
} from '../../stores/meetingsStore'
import {
  parseMeetingsFromFormData,
  type MeetingMetadata,
} from '../../utils/upload-meetings/parseMeetingsFormData'
import FormButton from '../common/FormButton'
import FormErrors from '../common/FormErrors'
import AddMeetingButton from './AddMeetingButton'
import MeetingForm from './MeetingForm'
import ServerErrorNotification from './notifications/ServerErrorNotification'
import SuccessNotification from './notifications/SuccessNotification'
import UploadingNotification from './notifications/UploadingNotification'

export interface MeetingFormData {
  id: string
  title: string
  date?: string
  language?: string
  speakers?: string
}

interface FormState {
  validationErrors: null | string[]
  serverError?: boolean
  uploadedMeetingsCount?: number
  success?: boolean
  newMeetings?: StoreMeeting[]
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

    const data = await response.json()

    return {
      success: true,
      validationErrors: null,
      uploadedMeetingsCount: meetingsMetadata.length,
      newMeetings: data,
    }
  } catch {
    return { validationErrors: null, serverError: true, success: false }
  }
}

function createMeeting(): MeetingFormData {
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
  const [meetings, setMeetings] = useState<MeetingFormData[]>([createMeeting()])
  const addMeetingToStore = useAddMeeting()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(uploadMeetingsAction, { validationErrors: null })

  const [notification, setNotification] = useState<Notification>('none')

  useEffect(() => {
    if (formState.validationErrors) {
      setNotification('none')
      return
    }

    if (isPending) {
      setNotification('uploading')
    } else if (formState.success) {
      setNotification('success')

      formState.newMeetings?.forEach(meeting => {
        addMeetingToStore(meeting)
      })

      handleCloseDialog()
    } else if (formState.serverError) {
      setNotification('serverError')
    }
  }, [isPending, formState, handleCloseDialog, addMeetingToStore])

  const handleSubmit = (formData: FormData) => {
    const updatedMeetings = meetings.map((meeting, index) => {
      const language = formData.get(`meetings[${index}][language]`) as string
      return {
        ...meeting,
        title:
          (formData.get(`meetings[${index}][title]`) as string) ||
          meeting.title,
        date:
          (formData.get(`meetings[${index}][date]`) as string) || meeting.date,
        language: language || meeting.language,
        speakers:
          (formData.get(`meetings[${index}][speakers]`) as string) ||
          meeting.speakers,
      }
    })

    setMeetings(updatedMeetings)
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

      {!isPending && <FormErrors errors={formState.validationErrors} />}

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
        <FormButton isPending={isPending} text="Submit" />
      </div>
    </form>
  )
}
