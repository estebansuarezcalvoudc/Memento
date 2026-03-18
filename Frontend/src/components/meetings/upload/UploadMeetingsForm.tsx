import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import useUploadMeetings from '../../../api/meetings/useUploadMeetings'
import { useGetSupportedLanguages } from '../../../api/queries/useSettingsQueries'
import ConfirmButton from '../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../ui/buttons/SecondaryButton'
import FormErrors from '../../ui/feedback/FormErrors'
import MeetingForm, { meetingFormGridCols } from './components/MeetingForm'
import UploadMeetingsHeaderRow from './components/UploadMeetingsHeaderRow'
import { type MeetingFormData } from './types'
import { parseMeetingsFromFormData } from './utils/parseMeetingsFormData'
import {
  getFailedMeetingsForRetry,
  getMeetingsFromFormData,
  processUploadMeetings,
} from './utils/uploadMeetingsForm.helpers'

interface FormState {
  validationErrors: null | string[]
}

function createMeeting(): MeetingFormData {
  return {
    id: crypto.randomUUID(),
    title: '',
  }
}

export default function UploadMeetingsForm() {
  const { t } = useTranslation()
  const {
    state: uploadState,
    startUpload,
    isPending,
    reset,
  } = useUploadMeetings()
  const { data: languages = [] } = useGetSupportedLanguages()
  const [meetings, setMeetings] = useState<MeetingFormData[]>([createMeeting()])
  const [formState, setFormState] = useState<FormState>({
    validationErrors: null,
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const submittedMeetings = getMeetingsFromFormData(meetings, formData)
    setMeetings(submittedMeetings)

    const parsed = parseMeetingsFromFormData(formData, t)
    if (!parsed.ok) {
      setFormState({ validationErrors: parsed.errors })
      return
    }

    setFormState({ validationErrors: null })

    const uploadResult = await processUploadMeetings(
      parsed.meetingsMetadata,
      parsed.audioFiles,
      startUpload,
    )

    if (uploadResult.phase === 'completed') {
      setMeetings([createMeeting()])
      setFormState({ validationErrors: null })
      reset()
      return
    }

    if (
      uploadResult.phase === 'completedWithErrors' &&
      uploadResult.errors.length
    ) {
      setMeetings(
        getFailedMeetingsForRetry(submittedMeetings, uploadResult.errors),
      )
      reset()
    }
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
              ? meeting.fromPreviousFailure
                ? 'failed'
                : null
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
