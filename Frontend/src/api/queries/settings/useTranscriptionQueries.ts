import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type TranscriptionAvailableOptions,
  type TranscriptionConfiguration,
  type TranscriptionProvider,
  type TranscriptionProviderName,
} from '../../../types/settings/transcription'
import fetchBackend from '../../utils/fetchBackend'

const OPTIONS_KEY = ['transcription', 'options']
const CONFIGURATION_KEY = ['transcription', 'configuration']
const PROVIDERS_KEY = ['transcription', 'providers']

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
    Partial<Record<string, string | boolean>>,
    { previous?: TranscriptionConfiguration }
  >({
    mutationFn: update =>
      fetchBackend('PATCH', 'settings/transcription/configuration', update),
    onMutate: async update => {
      await queryClient.cancelQueries({ queryKey: CONFIGURATION_KEY })
      const previous =
        queryClient.getQueryData<TranscriptionConfiguration>(CONFIGURATION_KEY)

      const optimistic: Partial<TranscriptionConfiguration> = {}
      if ('model_size' in update && typeof update.model_size === 'string') {
        optimistic.modelSize = update.model_size
      }
      if ('compute_type' in update && typeof update.compute_type === 'string') {
        optimistic.computeType = update.compute_type
      }
      if ('device' in update && typeof update.device === 'string') {
        optimistic.device = update.device
      }
      if ('speech_model' in update) {
        optimistic.speechModel = update.speech_model as string
      }
      if ('speaker_labels' in update) {
        optimistic.speakerLabels = update.speaker_labels as boolean
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

export function useGetTranscriptionProviders() {
  return useQuery<TranscriptionProvider[]>({
    queryKey: PROVIDERS_KEY,
    queryFn: () => fetchBackend('GET', 'settings/transcription/providers'),
  })
}

export function useSetActiveTranscriptionProvider() {
  const queryClient = useQueryClient()

  return useMutation<
    null,
    Error,
    TranscriptionProviderName,
    { previousProviders?: TranscriptionProvider[] }
  >({
    mutationFn: provider =>
      fetchBackend('PATCH', 'settings/transcription/active-provider', {
        provider,
      }),
    onMutate: async provider => {
      await queryClient.cancelQueries({ queryKey: PROVIDERS_KEY })

      const previousProviders =
        queryClient.getQueryData<TranscriptionProvider[]>(PROVIDERS_KEY)

      queryClient.setQueryData<TranscriptionProvider[]>(PROVIDERS_KEY, old =>
        (old ?? []).map(p => ({
          ...p,
          isActive: p.name === provider,
        })),
      )

      return { previousProviders }
    },
    onError: (_error, _provider, context) => {
      queryClient.setQueryData(PROVIDERS_KEY, context?.previousProviders)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY })
      queryClient.invalidateQueries({ queryKey: OPTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: CONFIGURATION_KEY })
    },
  })
}

export function useUploadTranscriptionApiKey() {
  const queryClient = useQueryClient()

  return useMutation<null, Error, { providerName: string; apiKey: string }>({
    mutationFn: ({ providerName, apiKey }) =>
      fetchBackend(
        'POST',
        `settings/transcription/providers/${providerName}/api-key`,
        {
          api_key: apiKey,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY })
      queryClient.invalidateQueries({ queryKey: OPTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: CONFIGURATION_KEY })
    },
  })
}

export function useDeleteTranscriptionApiKey() {
  const queryClient = useQueryClient()

  return useMutation<null, Error, string>({
    mutationFn: providerName =>
      fetchBackend(
        'DELETE',
        `settings/transcription/providers/${providerName}/api-key`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY })
      queryClient.invalidateQueries({ queryKey: OPTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: CONFIGURATION_KEY })
    },
  })
}
