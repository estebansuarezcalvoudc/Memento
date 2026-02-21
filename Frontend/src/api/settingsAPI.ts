import fetchBackend from './fetchBackend'

export interface LanguageOption {
  code: string
  name: string
}

export async function getSupportedLanguages(): Promise<LanguageOption[]> {
  return fetchBackend('GET', 'settings/transcription/languages')
}
