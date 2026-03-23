import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useGetTranscriptionConfiguration,
  useGetTranscriptionOptions,
  useGetTranscriptionProviders,
  useSetActiveTranscriptionProvider,
  useUpdateTranscriptionConfiguration,
} from '../../../../api/queries/settings/useTranscriptionQueries'
import {
  type TranscriptionAvailableOptions,
  type TranscriptionConfiguration,
} from '../../../../types/settings/transcription'
import AssemblyAITranscriptionSection from './AssemblyAITranscriptionSection'
import WhisperXTranscriptionSection from './WhisperXTranscriptionSection'

export default function TranscriptionView() {
  const { t } = useTranslation()
  const { data: options } = useGetTranscriptionOptions()
  const { data: config } = useGetTranscriptionConfiguration()
  const { data: providers } = useGetTranscriptionProviders()
  const { mutate: updateConfig } = useUpdateTranscriptionConfiguration()
  const { mutate: setActiveProvider } = useSetActiveTranscriptionProvider()

  const isInitialLoading = !options || !config || !providers
  const whisperProvider = providers?.find(p => p.name === 'whisperx')
  const assemblyProvider = providers?.find(p => p.name === 'aai')
  const [lastWhisperOptions, setLastWhisperOptions] =
    useState<TranscriptionAvailableOptions>()
  const [lastWhisperConfig, setLastWhisperConfig] =
    useState<TranscriptionConfiguration>()

  const hasWhisperOptions = Boolean(
    options?.models && options?.computeTypes && options?.devices,
  )
  const hasWhisperConfig = Boolean(
    config?.modelSize && config?.computeType && config?.device,
  )

  const whisperOptionsForUI = hasWhisperOptions
    ? options
    : (lastWhisperOptions ?? options)
  const whisperConfigForUI = hasWhisperConfig
    ? config
    : (lastWhisperConfig ?? config)

  useEffect(() => {
    if (
      whisperProvider?.isActive &&
      options?.models &&
      options?.computeTypes &&
      options?.devices
    ) {
      setLastWhisperOptions(options)
    }
  }, [whisperProvider?.isActive, options])

  useEffect(() => {
    if (
      whisperProvider?.isActive &&
      config?.modelSize &&
      config?.computeType &&
      config?.device
    ) {
      setLastWhisperConfig(config)
    }
  }, [whisperProvider?.isActive, config])

  function handleSelectProvider(providerName: 'whisperx' | 'aai') {
    const provider = providers?.find(p => p.name === providerName)
    if (!provider || provider.isActive) {
      return
    }
    setActiveProvider(providerName)
  }

  return (
    <>
      {isInitialLoading ? (
        <span>{t('settings.transcription.loading')}</span>
      ) : (
        <div className="flex flex-col gap-6">
          <WhisperXTranscriptionSection
            options={whisperOptionsForUI}
            modelSize={whisperConfigForUI?.modelSize}
            computeType={whisperConfigForUI?.computeType}
            device={whisperConfigForUI?.device}
            isActive={whisperProvider?.isActive ?? true}
            onSelectProvider={() => handleSelectProvider('whisperx')}
            onUpdateConfiguration={updateConfig}
          />

          <AssemblyAITranscriptionSection
            hasApiKey={assemblyProvider?.hasApiKey ?? false}
            isActive={assemblyProvider?.isActive ?? false}
            onSelectProvider={() => handleSelectProvider('aai')}
          />
        </div>
      )}
    </>
  )
}
