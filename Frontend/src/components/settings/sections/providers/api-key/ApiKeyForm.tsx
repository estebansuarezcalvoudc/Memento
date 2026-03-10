import { useUploadApiKey } from '../../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../../api/utils/fetchBackend'
import ProviderInlineForm from '../ProviderInlineForm'

interface ApiKeyFormProps {
  providerName: string
  onClose: () => void
}

export default function ApiKeyForm({ providerName, onClose }: ApiKeyFormProps) {
  const { mutateAsync: uploadApiKey } = useUploadApiKey()

  async function handleSubmit(apiKey: string) {
    try {
      await uploadApiKey({ providerName, apiKey })
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        throw new Error('Invalid API key')
      }
      throw error
    }
  }

  return (
    <ProviderInlineForm
      inputName="apiKey"
      placeholder="Enter your API key"
      emptyError="API key cannot be empty"
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}
