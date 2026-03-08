import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Provider } from '../../../types/settings/providers'
import fetchBackend from '../../utils/fetchBackend'

const PROVIDERS_KEY = ['providers']
const AVAILABLE_MODELS_KEY = ['models', 'available']

export function useGetProviders() {
  return useQuery<Provider[]>({
    queryKey: PROVIDERS_KEY,
    queryFn: () => fetchBackend('GET', 'settings/providers'),
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, string>({
    mutationFn: providerName =>
      fetchBackend('DELETE', `settings/providers/${providerName}/api-key`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY })
      queryClient.invalidateQueries({ queryKey: AVAILABLE_MODELS_KEY })
    },
  })
}

export function useUploadApiKey() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, { providerName: string; apiKey: string }>({
    mutationFn: ({ providerName, apiKey }) =>
      fetchBackend('POST', `settings/providers/${providerName}/api-key`, {
        api_key: apiKey,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  })
}
