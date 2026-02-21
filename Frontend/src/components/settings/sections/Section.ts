export const Section = {
  General: 'General',
  Provider: 'Provider',
  MeetingsProcessing: 'Meetings processing',
  Account: 'Account',
} as const

export type Section = (typeof Section)[keyof typeof Section]
