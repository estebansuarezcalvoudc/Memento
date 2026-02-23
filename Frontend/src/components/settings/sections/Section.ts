export const Section = {
  General: 'General',
  Provider: 'Provider',
  Transcription: 'Transcription',
  Summarization: 'Summarization',
  Account: 'Account',
} as const

export type Section = (typeof Section)[keyof typeof Section]
