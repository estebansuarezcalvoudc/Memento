import { useTranslation } from 'react-i18next'

import {
  useDeleteTranscriptionApiKey,
  useUploadTranscriptionApiKey,
} from '../../../../api/queries/settings/useTranscriptionQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'
import ApiKeySection from '../providers/api-key/ApiKeySection'
import ProviderSelectorTitle from './ProviderSelectorTitle'

interface AssemblyAITranscriptionSectionProps {
  hasApiKey: boolean
  isActive: boolean
  onSelectProvider: () => void
}

export default function AssemblyAITranscriptionSection({
  hasApiKey,
  isActive,
  onSelectProvider,
}: AssemblyAITranscriptionSectionProps) {
  const { t } = useTranslation()
  const { mutateAsync: uploadTranscriptionApiKey } =
    useUploadTranscriptionApiKey()
  const { mutateAsync: deleteTranscriptionApiKey } =
    useDeleteTranscriptionApiKey()

  async function addApiKey(providerName: string, apiKey: string) {
    try {
      await uploadTranscriptionApiKey({ providerName, apiKey })
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        throw new Error(t('settings.transcription.invalidApiKey'))
      }
      throw error
    }
  }

  async function removeApiKey(providerName: string) {
    await deleteTranscriptionApiKey(providerName)
  }

  return (
    <div>
      <ProviderSelectorTitle
        title="AssemblyAI"
        providerName="aai"
        checked={isActive}
        disabled={!hasApiKey}
        onSelect={() => onSelectProvider()}
      />
      <ApiKeySection
        providerName="aai"
        hasApiKey={hasApiKey}
        addApiKey={addApiKey}
        deleteApiKey={removeApiKey}
        addLabel={t('settings.providers.addApiKey')}
        removeLabel={t('settings.providers.removeApiKey')}
        addedLabel={t('settings.providers.apiKeyAdded')}
        invalidApiKeyMessage={t('settings.transcription.invalidApiKey')}
        deleteApiKeyFailedMessage={t(
          'settings.transcription.removeApiKeyFailed',
        )}
        apiKeyPlaceholder={t('settings.providers.apiKeyPlaceholder')}
        apiKeyEmptyError={t('settings.providers.apiKeyEmptyError')}
      />
    </div>
  )
}
