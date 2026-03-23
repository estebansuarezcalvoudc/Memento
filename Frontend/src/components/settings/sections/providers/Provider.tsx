import { useTranslation } from 'react-i18next'

import {
  useDeleteApiKey,
  useUploadApiKey,
} from '../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'
import { type Provider } from '../../../../types/settings/providers'
import SubSectionTitle from '../SubSectionTitle'
import ApiKeySection from './api-key/ApiKeySection'
import PullModelSection from './pull-model/PullModelSection'

export default function Provider({ provider }: { provider: Provider }) {
  const { t } = useTranslation()
  const { mutateAsync: uploadApiKey } = useUploadApiKey()
  const { mutateAsync: deleteApiKey } = useDeleteApiKey()

  async function addProviderApiKey(providerName: string, apiKey: string) {
    try {
      await uploadApiKey({ providerName, apiKey })
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        throw new Error(t('settings.providers.invalidApiKey'))
      }
      throw error
    }
  }

  async function removeProviderApiKey(providerName: string) {
    await deleteApiKey(providerName)
  }

  return (
    <div className="flex items-center justify-between">
      <SubSectionTitle title={provider.name} />
      <div className="flex items-center gap-2">
        {provider.requiresApiKey && (
          <ApiKeySection
            providerName={provider.name}
            hasApiKey={provider.hasApiKey ?? false}
            addApiKey={addProviderApiKey}
            deleteApiKey={removeProviderApiKey}
            addLabel={t('settings.providers.addApiKey')}
            removeLabel={t('settings.providers.removeApiKey')}
            addedLabel={t('settings.providers.apiKeyAdded')}
            invalidApiKeyMessage={t('settings.providers.invalidApiKey')}
            deleteApiKeyFailedMessage={t(
              'settings.providers.removeApiKeyFailed',
            )}
            apiKeyPlaceholder={t('settings.providers.apiKeyPlaceholder')}
            apiKeyEmptyError={t('settings.providers.apiKeyEmptyError')}
          />
        )}
        {provider.name === 'Ollama' && (
          <PullModelSection providerName={provider.name} />
        )}
      </div>
    </div>
  )
}
