import { useQuery } from '@tanstack/react-query'

import fetchBackend from '../utils/fetchBackend'

export interface LanguageOption {
  code: string
  name: string
}

async function getSupportedLanguages(): Promise<LanguageOption[]> {
  return fetchBackend('GET', 'settings/transcription/languages')
}

export function useGetSupportedLanguages() {
  return useQuery({
    queryKey: ['settings', 'languages'],
    queryFn: getSupportedLanguages,
  })
}
