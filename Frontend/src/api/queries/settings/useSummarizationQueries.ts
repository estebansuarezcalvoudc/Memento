import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type SummarizationPrompt } from '../../../types/settings/summarization'
import fetchBackend from '../../utils/fetchBackend'

const PROMPT_KEY = ['summarization', 'prompt']
const DEFAULT_PROMPT_KEY = ['summarization', 'default-prompt']

export function useGetSummarizationPrompt() {
  return useQuery<SummarizationPrompt>({
    queryKey: PROMPT_KEY,
    queryFn: () => fetchBackend('GET', 'settings/templates/prompt'),
  })
}

export function useGetDefaultSummarizationPrompt() {
  return useQuery<SummarizationPrompt>({
    queryKey: DEFAULT_PROMPT_KEY,
    queryFn: () => fetchBackend('GET', 'settings/templates/default-prompt'),
  })
}

export function useUpdateSummarizationPrompt() {
  const queryClient = useQueryClient()
  return useMutation<SummarizationPrompt, Error, string>({
    mutationFn: systemPrompt =>
      fetchBackend('PUT', 'settings/templates/prompt', { system_prompt: systemPrompt }),
    onSuccess: data => {
      queryClient.setQueryData<SummarizationPrompt>(PROMPT_KEY, data)
    },
  })
}
