import fetchBackend from './fetchBackend'

export interface LanguageOption {
  code: string
  name: string
}

export default function useWhisperXAPI() {
  const getSupportedLanguages = async (): Promise<LanguageOption[]> => {
    return fetchBackend('GET', 'settings/transcription/whisperx/languages')
  }

  return {
    getSupportedLanguages,
  }
}
