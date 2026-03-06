import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type TranscriptionAvailableOptions,
  type TranscriptionConfiguration,
} from '../../../types/settings/transcription'
import fetchBackend from '../../utils/fetchBackend'

const OPTIONS_KEY = ['transcription', 'options']
const CONFIGURATION_KEY = ['transcription', 'configuration']

export function useGetTranscriptionOptions() {
  return useQuery<TranscriptionAvailableOptions>({
    queryKey: OPTIONS_KEY,
    queryFn: () =>
      fetchBackend('GET', 'settings/transcription/available-options'),
  })
}

export function useGetTranscriptionConfiguration() {
  return useQuery<TranscriptionConfiguration>({
    queryKey: CONFIGURATION_KEY,
    queryFn: () => fetchBackend('GET', 'settings/transcription/configuration'),
  })
}

export function useUpdateTranscriptionConfiguration() {
  const queryClient = useQueryClient()
  return useMutation<
    TranscriptionConfiguration,
    Error,
    Partial<Record<string, string>>
  >({
    mutationFn: update =>
      fetchBackend('PATCH', 'settings/transcription/configuration', update),
    onMutate: async update => {
      await queryClient.cancelQueries({ queryKey: CONFIGURATION_KEY })
      const previous =
        queryClient.getQueryData<TranscriptionConfiguration>(CONFIGURATION_KEY)

      const optimistic: Partial<TranscriptionConfiguration> = {}
      if ('model_size' in update) {
        optimistic.modelSize = update.model_size
      }
      if ('compute_type' in update) {
        optimistic.computeType = update.compute_type
      }
      if ('device' in update) {
        optimistic.device = update.device
      }

      queryClient.setQueryData<TranscriptionConfiguration>(
        CONFIGURATION_KEY,
        old => ({
          ...old!,
          ...optimistic,
        }),
      )

      return { previous }
    },
    onError: (_err, _update, context) => {
      queryClient.setQueryData(CONFIGURATION_KEY, context?.previous)
    },
    onSuccess: data => {
      queryClient.setQueryData(CONFIGURATION_KEY, data)
    },
  })
}
