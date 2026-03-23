import { useTranslation } from 'react-i18next'

import { HttpError } from '../../../../../api/utils/fetchBackend'
import ProviderInlineForm from '../ProviderInlineForm'

interface ApiKeyFormProps {
  invalidApiKeyMessage?: string
  onSubmitApiKey: (apiKey: string) => Promise<void>
  onClose: () => void
  apiKeyPlaceholder?: string
  apiKeyEmptyError?: string
}

export default function ApiKeyForm({
  invalidApiKeyMessage,
  onSubmitApiKey,
  onClose,
  apiKeyPlaceholder,
  apiKeyEmptyError,
}: ApiKeyFormProps) {
  const { t } = useTranslation()

  async function handleSubmit(apiKey: string) {
    try {
      await onSubmitApiKey(apiKey)
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        throw new Error(
          invalidApiKeyMessage ?? t('settings.providers.invalidApiKey'),
        )
      }
      throw error
    }
  }

  return (
    <ProviderInlineForm
      inputName="apiKey"
      placeholder={
        apiKeyPlaceholder ?? t('settings.providers.apiKeyPlaceholder')
      }
      emptyError={apiKeyEmptyError ?? t('settings.providers.apiKeyEmptyError')}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}
