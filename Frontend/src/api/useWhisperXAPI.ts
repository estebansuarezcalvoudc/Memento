import { useCallback } from 'react'

import fetchBackend from './fetchBackend'

export interface LanguageOption {
  code: string
  name: string
}

export default function useWhisperXAPI() {
  const getSupportedLanguages = useCallback(async (): Promise<
    LanguageOption[]
  > => {
    return fetchBackend('GET', 'settings/transcription/whisperx/languages')
  }, [])
  return {
    getSupportedLanguages,
  }
}
