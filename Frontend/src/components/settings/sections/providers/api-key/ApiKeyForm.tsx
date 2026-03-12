import { useTranslation } from 'react-i18next'

import { useUploadApiKey } from '../../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../../api/utils/fetchBackend'
import ProviderInlineForm from '../ProviderInlineForm'

interface ApiKeyFormProps {
  providerName: string
  onClose: () => void
}

export default function ApiKeyForm({ providerName, onClose }: ApiKeyFormProps) {
  const { t } = useTranslation()
  const { mutateAsync: uploadApiKey } = useUploadApiKey()

  async function handleSubmit(apiKey: string) {
    try {
      await uploadApiKey({ providerName, apiKey })
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        throw new Error(t('settings.providers.invalidApiKey'))
      }
      throw error
    }
  }

  return (
    <ProviderInlineForm
      inputName="apiKey"
      placeholder={t('settings.providers.apiKeyPlaceholder')}
      emptyError={t('settings.providers.apiKeyEmptyError')}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}
