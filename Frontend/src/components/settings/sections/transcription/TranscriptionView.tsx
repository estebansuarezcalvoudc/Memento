import { useTranslation } from 'react-i18next'

import {
  useGetTranscriptionConfiguration,
  useGetTranscriptionOptions,
  useGetTranscriptionProviders,
  useSetActiveTranscriptionProvider,
  useUpdateTranscriptionConfiguration,
} from '../../../../api/queries/settings/useTranscriptionQueries'
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
            options={options}
            modelSize={config?.modelSize}
            computeType={config?.computeType}
            device={config?.device}
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
