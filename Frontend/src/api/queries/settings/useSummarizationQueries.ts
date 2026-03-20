import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type SummarizationPrompt } from '../../../types/settings/summarization'
import fetchBackend from '../../utils/fetchBackend'

const PROMPT_KEY = ['summarization', 'prompt'] as const

export function useGetSummarizationPrompt(lang: string) {
  return useQuery<SummarizationPrompt>({
    queryKey: [...PROMPT_KEY, lang],
    queryFn: () =>
      fetchBackend('GET', `settings/templates/prompt?lang=${lang}`),
    meta: { dependsOnLanguage: true },
  })
}

export function useGetDefaultSummarizationPrompt(lang: string) {
  return useQuery<SummarizationPrompt>({
    queryKey: ['summarization', 'default-prompt', lang],
    queryFn: () =>
      fetchBackend('GET', `settings/templates/default-prompt?lang=${lang}`),
    meta: { dependsOnLanguage: true },
  })
}

export function useUpdateSummarizationPrompt(lang: string) {
  const queryClient = useQueryClient()
  return useMutation<SummarizationPrompt, Error, string>({
    mutationFn: systemPrompt =>
      fetchBackend('PUT', 'settings/templates/prompt', {
        system_prompt: systemPrompt,
      }),
    onSuccess: data => {
      queryClient.setQueryData<SummarizationPrompt>([...PROMPT_KEY, lang], data)
      queryClient.invalidateQueries({ queryKey: PROMPT_KEY })
    },
  })
}
