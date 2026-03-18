import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useUploadMeetings, {
  type UploadMeetingsState,
} from '../../../api/meetings/useUploadMeetings'
import { useGetSupportedLanguages } from '../../../api/queries/useSettingsQueries'
import ConfirmButton from '../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../ui/buttons/SecondaryButton'
import FormErrors from '../../ui/feedback/FormErrors'
import ColumnHeader from '../ColumnHeader'
import MeetingForm, { meetingFormGridCols } from './MeetingForm'
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
      {(uploadState.phase === 'uploading' ||
        uploadState.phase === 'completedWithErrors' ||
        uploadState.phase === 'failed') && (
        <UploadProgressSummary
          processed={uploadState.processed}
          total={uploadState.total}
          succeeded={uploadState.succeeded}
          failed={uploadState.failed}
          progressPercent={progressPercent}
          phase={uploadState.phase}
        />
      )}

      <div
        className={`hidden ${meetingFormGridCols} items-center gap-x-2 border-b border-stone-300 py-2 min-[800px]:grid min-[800px]:justify-center dark:border-stone-600`}
      >
        <ColumnHeader size="xs">
          {t('meetings.uploadDialog.columns.number')}
        </ColumnHeader>
        <ColumnHeader size="xs">
          {t('meetings.uploadDialog.columns.status')}
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

function UploadProgressSummary({
  processed,
  total,
  succeeded,
  failed,
  progressPercent,
  phase,
}: {
  processed: number
  total: number
  succeeded: number
  failed: number
  progressPercent: number
  phase: UploadMeetingsState['phase']
}) {
  const totalSafe = total > 0 ? total : 0
  const textColor =
    phase === 'failed'
      ? 'text-red-700 dark:text-red-400'
      : 'text-stone-700 dark:text-stone-300'

  return (
    <div
      className={`mb-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm ${textColor} dark:border-stone-700 dark:bg-stone-800`}
    >
      <div className="font-ubuntu flex items-center justify-between">
        <span>
          {processed}/{totalSafe} · {progressPercent}%
        </span>
        <span>
          OK: {succeeded} · ERR: {failed}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-stone-200 dark:bg-stone-700">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
