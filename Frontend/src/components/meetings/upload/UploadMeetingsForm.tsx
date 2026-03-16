import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useUploadMeetings } from '../../../api/queries/useMeetingsQueries'
import { useGetSupportedLanguages } from '../../../api/queries/useSettingsQueries'
import { type Meeting } from '../../../types/meetings'
import ConfirmButton from '../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../ui/buttons/SecondaryButton'
import FormErrors from '../../ui/feedback/FormErrors'
import ColumnHeader from '../ColumnHeader'
import MeetingForm, { meetingFormGridCols } from './MeetingForm'
import ServerErrorNotification from './notifications/ServerErrorNotification'
import SuccessNotification from './notifications/SuccessNotification'
import UploadingNotification from './notifications/UploadingNotification'
import {
  parseMeetingsFromFormData,
  type MeetingMetadata,
} from './parseMeetingsFormData'

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
}

type Notification = 'none' | 'uploading' | 'success' | 'serverError'

function createMeeting(): MeetingFormData {
  return {
    id: crypto.randomUUID(),
    title: '',
  }
}

export default function UploadMeetingsForm({
  handleCloseDialog,
}: {
  handleCloseDialog: () => void
}) {
  const { t } = useTranslation()
  const { mutateAsync: uploadMeetings } = useUploadMeetings()
  const { data: languages = [] } = useGetSupportedLanguages()
  const [meetings, setMeetings] = useState<MeetingFormData[]>([createMeeting()])
  const [isPending, setIsPending] = useState(false)
  const [formState, setFormState] = useState<FormState>({
    validationErrors: null,
  })

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
      setMeetings([createMeeting()])
      handleCloseDialog()
    } else if (formState.serverError) {
      setNotification('serverError')
    }
  }, [isPending, formState, handleCloseDialog])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

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
    setIsPending(true)

    const parsed = parseMeetingsFromFormData(formData, t)
    if (!parsed.ok) {
      setFormState({ validationErrors: parsed.errors })
      setIsPending(false)
      return
    }

    const nextState = await processUploadMeetings(
      parsed.meetingsMetadata,
      parsed.audioFiles,
      uploadMeetings,
    )
    setFormState(nextState)
    setIsPending(false)
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
    <form onSubmit={handleSubmit}>
      <div
        className={`grid ${meetingFormGridCols} justify-center gap-4 border-b border-stone-300 py-2 dark:border-stone-600`}
      >
        <ColumnHeader size="xs">
          {t('meetings.uploadDialog.columns.number')}
        </ColumnHeader>
        <ColumnHeader size="xs">
          {t('meetings.uploadDialog.columns.title')}
        </ColumnHeader>
        <ColumnHeader size="xs">
          {t('meetings.uploadDialog.columns.date')}
        </ColumnHeader>
        <ColumnHeader size="xs">
          {t('meetings.uploadDialog.columns.file')}
        </ColumnHeader>
        <div />
        <div />
      </div>

      {meetings.map((meeting, index) => (
        <MeetingForm
          key={meeting.id}
          meeting={meeting}
          index={index}
          meetingsCount={meetings.length}
          isPending={isPending}
          onRemove={removeMeeting}
          languages={languages}
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
        <SecondaryButton
          onClick={addMeeting}
          disabled={isPending}
          label={t('meetings.uploadDialog.addMeeting')}
        />
        <ConfirmButton
          isPending={isPending}
          label={t('meetings.uploadDialog.submit')}
          pendingLabel={t('meetings.uploadDialog.uploading')}
        />
      </div>
    </form>
  )
}

async function processUploadMeetings(
  meetingsMetadata: MeetingMetadata[],
  audioFiles: File[],
  uploadMeetings: (formData: FormData) => Promise<Meeting[]>,
): Promise<FormState> {
  try {
    const backendFormData = new FormData()
    backendFormData.append(
      'meetings_data',
      JSON.stringify({ meetings_metadata: meetingsMetadata }),
    )

    audioFiles.forEach(file => backendFormData.append('audios', file))

    await uploadMeetings(backendFormData)

    return {
      success: true,
      validationErrors: null,
      uploadedMeetingsCount: meetingsMetadata.length,
    }
  } catch {
    return { validationErrors: null, serverError: true, success: false }
  }
}
