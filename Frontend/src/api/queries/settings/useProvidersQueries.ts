import { useMutation, useQuery } from '@tanstack/react-query'

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
  return useMutation<null, Error, string>({
    mutationFn: providerName =>
      fetchBackend('DELETE', `settings/providers/${providerName}/api-key`),
    onError: () => {},
  })
}
export function useUploadApiKey() {
  return useMutation<null, Error, { providerName: string; apiKey: string }>({
    mutationFn: ({ providerName, apiKey }) =>
      fetchBackend('POST', `settings/providers/${providerName}/api-key`, {
        api_key: apiKey,
      }),
  })
}
