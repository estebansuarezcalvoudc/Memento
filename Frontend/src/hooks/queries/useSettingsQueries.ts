import { useQuery } from '@tanstack/react-query'
import { getSupportedLanguages, type LanguageOption } from '../../api/settingsAPI'

export type { LanguageOption }

export function useGetSupportedLanguages() {
  return useQuery({
    queryKey: ['settings', 'languages'],
    queryFn: getSupportedLanguages,
  })
}
