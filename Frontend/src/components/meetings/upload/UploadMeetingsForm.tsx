import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useUploadMeetings, {
  type UploadMeetingsState,
} from '../../../api/meetings/useUploadMeetings'
import { useGetSupportedLanguages } from '../../../api/queries/useSettingsQueries'
import ConfirmButton from '../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../ui/buttons/SecondaryButton'
import FormErrors from '../../ui/feedback/FormErrors'
import MeetingForm, { meetingFormGridCols } from './MeetingForm'
import {
  parseMeetingsFromFormData,
  type MeetingMetadata,
} from './parseMeetingsFormData'
import UploadMeetingsHeaderRow from './UploadMeetingsHeaderRow'
import UploadProgressSummary from './UploadProgressSummary'

export interface MeetingFormData {
  id: string
  title: string
  date?: string
  language?: string
  speakers?: string
}

interface FormState {
  validationErrors: null | string[]
}

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
  const {
    state: uploadState,
    startUpload,
    progressPercent,
    isPending,
    reset,
  } = useUploadMeetings()
  const { data: languages = [] } = useGetSupportedLanguages()
  const [meetings, setMeetings] = useState<MeetingFormData[]>([createMeeting()])
  const [formState, setFormState] = useState<FormState>({
    validationErrors: null,
  })

  const showProgress =
    uploadState.phase === 'uploading' ||
    uploadState.phase === 'completedWithErrors' ||
    uploadState.phase === 'failed'

  useEffect(() => {
    if (uploadState.phase === 'completed') {
      setMeetings([createMeeting()])
      reset()
      handleCloseDialog()
    }
  }, [uploadState.phase, handleCloseDialog, reset])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    setMeetings(getMeetingsFromFormData(meetings, formData))

    const parsed = parseMeetingsFromFormData(formData, t)
    if (!parsed.ok) {
      setFormState({ validationErrors: parsed.errors })
      return
    }

    setFormState({ validationErrors: null })

    await processUploadMeetings(
      parsed.meetingsMetadata,
      parsed.audioFiles,
      startUpload,
    )
  }

  const addMeeting = () => setMeetings(prev => [...prev, createMeeting()])

  const removeMeeting = (id: string) => {
    setMeetings(prev =>
      prev.length > 1 ? prev.filter(m => m.id !== id) : prev,
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <UploadMeetingsHeaderRow gridClassName={meetingFormGridCols} />

      {meetings.map((meeting, index) => (
        <MeetingForm
          key={meeting.id}
          meeting={meeting}
          index={index}
          meetingsCount={meetings.length}
          isPending={isPending}
          status={
            uploadState.phase === 'idle'
              ? null
              : (uploadState.meetingStatuses[index] ?? 'waiting')
          }
          onRemove={removeMeeting}
          languages={languages}
        />
      ))}

      {!isPending && <FormErrors errors={formState.validationErrors} />}

      {showProgress && (
        <UploadProgressSummary
          processed={uploadState.processed}
          total={uploadState.total}
          succeeded={uploadState.succeeded}
          failed={uploadState.failed}
          progressPercent={progressPercent}
          phase={uploadState.phase}
        />
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
  startUpload: (
    formData: FormData,
    meetingsCount: number,
  ) => Promise<UploadMeetingsState>,
): Promise<void> {
  try {
    const backendFormData = new FormData()
    backendFormData.append(
      'meetings_data',
      JSON.stringify({ meetings_metadata: meetingsMetadata }),
    )

    audioFiles.forEach(file => backendFormData.append('audios', file))

    await startUpload(backendFormData, meetingsMetadata.length)
  } catch {
    return
  }
}

function getMeetingsFromFormData(
  meetings: MeetingFormData[],
  formData: FormData,
): MeetingFormData[] {
  return meetings.map((meeting, index) => {
    const language = formData.get(`meetings[${index}][language]`) as string

    return {
      ...meeting,
      title:
        (formData.get(`meetings[${index}][title]`) as string) || meeting.title,
      date:
        (formData.get(`meetings[${index}][date]`) as string) || meeting.date,
      language: language || meeting.language,
      speakers:
        (formData.get(`meetings[${index}][speakers]`) as string) ||
        meeting.speakers,
    }
  })
}
