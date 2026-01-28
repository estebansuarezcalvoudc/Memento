import { useActionState, useState } from 'react'

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
  success?: boolean
  meetingsData?: Meeting[]
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
    const audioFiles: File[] = []
    const meetingsMetadata: MeetingMetadata[] = []

    let meetingIndex = 0
    while (formData.has(`meetings[${meetingIndex}][title]`)) {
      const title = formData.get(`meetings[${meetingIndex}][title]`) as string
      const date = formData.get(`meetings[${meetingIndex}][date]`) as string
      const language = formData.get(`meetings[${meetingIndex}][language]`) as string
      const speakers = formData.get(`meetings[${meetingIndex}][speakers]`) as string
      const audioFile = formData.get(`meetings[${meetingIndex}][file]`) as File

      // Validaciones
      if (!title || title.trim() === '') {
        return {
          errors: [`Meeting ${meetingIndex + 1}: Title is required`],
        }
      }

      if (!date) {
        return {
          errors: [`Meeting ${meetingIndex + 1}: Date is required`],
        }
      }

      if (!audioFile || audioFile.size === 0) {
        return {
          errors: [`Meeting ${meetingIndex + 1}: Audio file is required`],
        }
      }

      // Construir metadata
      const metadata: MeetingMetadata = {
        title: title.trim(),
        date: date,
      }

      if (language && language.trim() !== '') {
        metadata.language = language.trim()
      }

      if (speakers && speakers.trim() !== '') {
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
      return {
        errors: ['You must add at least one meeting'],
      }
    }

    return await processUploadMeetings(meetingsMetadata, audioFiles)
  } catch (error) {
    console.error('Error in uploadMeetingsAction:', error)
    return {
      errors: ['An unexpected error occurred'],
    }
  }
}

async function processUploadMeetings(
  meetingsMetadata: MeetingMetadata[],
  audioFiles: File[],
): Promise<FormState> {
  try {
    const meetingsData = {
      meetings_metadata: meetingsMetadata,
      // TODO añadir processing configuration, esto sale de los ajustes del usuario
    }

    console.log('Sending data:', meetingsData)
    console.log('Audio files:', audioFiles)

    const backendFormData = new FormData()
    backendFormData.append('meetings_data', JSON.stringify(meetingsData))
    
    audioFiles.forEach((file: File) => {
      backendFormData.append('audios', file)
    })

    const token = localStorage.getItem('access_token')
    if (!token) {
      return {
        errors: ['You must be logged in to upload meetings'],
      }
    }

    const response = await fetch('/api/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      
      try {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        errorMessage = errorData.detail || errorMessage
      } catch {
        const errorText = await response.text()
        console.error('Error text:', errorText)
        if (errorText) {
          errorMessage = errorText
        }
      }

      return {
        errors: [errorMessage],
      }
    }

    return {
      errors: null,
      success: true,
    }
  } catch (error) {
    console.error('Error in processUploadMeetings:', error)
    return {
      errors: ['Network error or server unavailable'],
    }
  }
}

export default function UploadMeetingsForm() {
  const [meetings, setMeetings] = useState<Meeting[]>([{ title: '' }])
  const [formState, formAction, isPending] = useActionState<FormState, FormData>(
    uploadMeetingsAction,
    {
      errors: null,
    },
  )

  const addMeeting = () => {
    setMeetings(prev => [
      ...prev,
      {
        title: '',
        meetingDate: undefined,
        language: undefined,
        speakers: undefined,
      },
    ])
  }

  const removeMeeting = (index: number) => {
    if (meetings.length > 1) {
      setMeetings(prev => prev.filter((_, i) => i !== index))
    }
  }

  return (
    <form action={formAction}>
      {meetings.map((meeting, i) => (
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
                className="cursor-pointer rounded-xl p-2 text-stone-700 hover:bg-stone-300"
                type="button"
                onClick={() => removeMeeting(i)}
                disabled={isPending}
              >
                {removeMeetingImage}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Title"
              id={`meetings[${i}][title]`}
              name={`meetings[${i}][title]`}
              type="text"
              defaultValue={meeting.title}
              required
              disabled={isPending}
            />

            <Input
              label="Date"
              id={`meetings[${i}][date]`}
              name={`meetings[${i}][date]`}
              type="date"
              defaultValue={meeting.meetingDate}
              required
              disabled={isPending}
            />

            <Input
              label="Language (optional)"
              id={`meetings[${i}][language]`}
              name={`meetings[${i}][language]`}
              type="text"
              placeholder="e.g., en, es"
              defaultValue={meeting.language}
              disabled={isPending}
            />

            <Input
              label="Number of speakers (optional)"
              id={`meetings[${i}][speakers]`}
              name={`meetings[${i}][speakers]`}
              type="number"
              min="2"
              defaultValue={meeting.speakers}
              disabled={isPending}
            />

            <Input
              label="Audio File"
              id={`meetings[${i}][file]`}
              name={`meetings[${i}][file]`}
              type="file"
              accept="audio/*,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
              required
              disabled={isPending}
            />
          </div>
        </div>
      ))}

      {formState.errors && (
        <div className="mt-4 rounded-lg bg-red-100 p-3">
          {formState.errors.map((error, i) => (
            <p key={i} className="font-ubuntu text-sm text-red-700">
              ❌ {error}
            </p>
          ))}
        </div>
      )}

      {formState.success && (
        <div className="mt-4 rounded-lg bg-green-100 p-3">
          <p className="font-ubuntu text-sm text-green-700">
            ✓ Meetings uploaded successfully!
          </p>
        </div>
      )}

      <div className="mt-5 mb-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={addMeeting}
          disabled={isPending}
          className="font-ubuntu cursor-pointer rounded-lg bg-stone-200 px-2 py-1.5 text-base text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add meeting
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="font-ubuntu cursor-pointer rounded-lg bg-blue-400 px-2 py-1.5 text-base text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
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
    className="icon icon-tabler icons-tabler-outline icon-tabler-trash-x"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 7h16" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    <path d="M10 12l4 4m0 -4l-4 4" />
  </svg>
)
