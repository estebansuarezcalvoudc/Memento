import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Provider } from '../../../types/settings/providers'
import fetchBackend from '../../utils/fetchBackend'

const PROVIDERS_KEY = ['providers']

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  })
}

export function useUpdateProviderStatus() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, { providerName: string; active: boolean }>({
    mutationFn: ({ providerName, active }) =>
      fetchBackend('PUT', `settings/providers/${providerName}/status`, {
        active,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
    onError: () => queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY }),
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
