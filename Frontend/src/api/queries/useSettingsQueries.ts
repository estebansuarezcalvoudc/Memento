import { useQuery } from '@tanstack/react-query'

import fetchBackend from '../utils/fetchBackend'

export interface LanguageOption {
  code: string
  name: string
}

export function useGetSupportedLanguages() {
  return useQuery<LanguageOption[]>({
    queryKey: ['settings', 'languages'],
    queryFn: () => fetchBackend('GET', 'settings/transcription/languages'),
  })
}
