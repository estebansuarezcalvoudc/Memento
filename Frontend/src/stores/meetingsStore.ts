import { create } from 'zustand'

export interface Meeting {
  id: string
  title: string
  date: string
}

interface MeetingsStore {
  meetings: Meeting[]
  setMeetings: (meetings: Meeting[]) => void
  addMeeting: (meeting: Meeting) => void
  removeMeeting: (id: string) => void
  updateMeeting: (id: string, meeting: Partial<Meeting>) => void
}

const useMeetingsStore = create<MeetingsStore>(set => ({
  meetings: [],
  setMeetings: meetings => set({ meetings }),
  addMeeting: meeting =>
    set(state => ({ meetings: [...state.meetings, meeting] })),
  removeMeeting: id =>
    set(state => ({
      meetings: state.meetings.filter(meeting => meeting.id !== id),
    })),
  updateMeeting: (id, updatedMeeting) =>
    set(state => ({
      meetings: state.meetings.map(meeting =>
        meeting.id === id ? { ...meeting, ...updatedMeeting } : meeting,
      ),
    })),
}))

export const useMeetings = () => useMeetingsStore(state => state.meetings)
export const useSetMeetings = () => useMeetingsStore(state => state.setMeetings)
export const useAddMeeting = () => useMeetingsStore(state => state.addMeeting)
export const useRemoveMeeting = () =>
  useMeetingsStore(state => state.removeMeeting)
export const useUpdateMeeting = () =>
  useMeetingsStore(state => state.updateMeeting)
