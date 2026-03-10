import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type AvailableModel,
  type ModelConfig,
  type PullModelRequest,
} from '../../../types/settings/models'
import fetchBackend from '../../utils/fetchBackend'

const AVAILABLE_MODELS_KEY = ['models', 'available']
const SUMMARY_MODEL_KEY = ['models', 'summary']
const CHAT_MODEL_KEY = ['models', 'chat']

export function useGetAvailableModels() {
  return useQuery<AvailableModel[]>({
    queryKey: AVAILABLE_MODELS_KEY,
    queryFn: () => fetchBackend('GET', 'settings/models/available'),
  })
}

export function useGetSummaryModel() {
  return useQuery<ModelConfig | null>({
    queryKey: SUMMARY_MODEL_KEY,
    queryFn: () => fetchBackend('GET', 'settings/models/summary'),
  })
}

export function useUpdateSummaryModel() {
  const queryClient = useQueryClient()
  return useMutation<ModelConfig, Error, ModelConfig>({
    mutationFn: model =>
      fetchBackend('PUT', 'settings/models/summary', {
        provider: model.provider,
        model_name: model.modelName,
        temperature: model.temperature,
        max_tokens: model.maxTokens,
      }),
    onSuccess: data => {
      queryClient.setQueryData<ModelConfig>(SUMMARY_MODEL_KEY, data)
    },
  })
}

export function useGetChatModel() {
  return useQuery<ModelConfig | null>({
    queryKey: CHAT_MODEL_KEY,
    queryFn: () => fetchBackend('GET', 'settings/models/chat'),
  })
}

export function useUpdateChatModel() {
  const queryClient = useQueryClient()
  return useMutation<ModelConfig, Error, ModelConfig>({
    mutationFn: model =>
      fetchBackend('PUT', 'settings/models/chat', {
        provider: model.provider,
        model_name: model.modelName,
        temperature: model.temperature,
        max_tokens: model.maxTokens,
      }),
    onSuccess: data => {
      queryClient.setQueryData<ModelConfig>(CHAT_MODEL_KEY, data)
    },
  })
}

const RETRIEVAL_MODEL_KEY = ['models', 'retrieval']

export function useGetRetrievalModel() {
  return useQuery<ModelConfig | null>({
    queryKey: RETRIEVAL_MODEL_KEY,
    queryFn: () => fetchBackend('GET', 'settings/models/retrieval'),
  })
}

export function useUpdateRetrievalModel() {
  const queryClient = useQueryClient()
  return useMutation<ModelConfig, Error, ModelConfig>({
    mutationFn: model =>
      fetchBackend('PUT', 'settings/models/retrieval', {
        provider: model.provider,
        model_name: model.modelName,
        temperature: model.temperature,
        max_tokens: model.maxTokens,
      }),
    onSuccess: data => {
      queryClient.setQueryData<ModelConfig>(RETRIEVAL_MODEL_KEY, data)
    },
  })
}

export function usePullModel() {
  const queryClient = useQueryClient()
  return useMutation<null, Error, PullModelRequest>({
    mutationFn: vars =>
      fetchBackend('POST', 'settings/models/pull', vars),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AVAILABLE_MODELS_KEY })
      await queryClient.invalidateQueries({ queryKey: RETRIEVAL_MODEL_KEY })
    },
  })
}
