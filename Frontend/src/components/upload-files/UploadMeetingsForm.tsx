import { useState } from 'react'

import Input from './Input'

interface Meeting {
  title: string
  audioFile?: File
  meetingDate?: string
  language?: string
  speakers?: number
}

export default function UploadMeetingsForm() {
  const [meetings, setMeetings] = useState<Meeting[]>([{ title: '' }])

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
    setMeetings(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <form>
        {meetings.map((meeting, i) => (
          <div
            key={i}
            className="mt-4 rounded-2xl border-2 border-dotted border-stone-400 bg-stone-100 p-3"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-ubuntu text-lg text-stone-700">
                Meeting {i + 1}
              </span>

              <button
                className="cursor-pointer rounded-xl p-2 text-stone-700 hover:bg-stone-300"
                type="button"
                onClick={() => removeMeeting(i)}
              >
                {removeMeetingImage}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Title"
                id="title"
                name="title"
                type="text"
                defaultValue={meeting.title}
              />

              <Input
                label="Date"
                id="date"
                name="date"
                type="date"
                defaultValue={meeting.meetingDate}
              />

              <Input
                label="Language"
                id="language"
                name="language"
                type="text"
                defaultValue={meeting.language}
              />

              <Input
                label="Number of speakers"
                id="speakers"
                name="speakers"
                type="number"
                min="2"
                defaultValue={meeting.meetingDate}
              />

              <Input label="File" id="file" name="file" type="file" />
            </div>
          </div>
        ))}
      </form>

      <div className="mt-5 mb-4 flex items-center justify-center gap-4">
        <button
          onClick={addMeeting}
          className="font-ubuntu cursor-pointer rounded-lg bg-stone-200 px-2 py-1.5 text-base text-stone-700"
        >
          + Add meeting
        </button>
        <button className="font-ubuntu cursor-pointer rounded-lg bg-blue-400 px-2 py-1.5 text-base text-stone-800">
          Submit
        </button>
      </div>
    </>
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
