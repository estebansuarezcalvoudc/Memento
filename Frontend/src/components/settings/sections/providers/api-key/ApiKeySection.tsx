import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useDeleteApiKey } from '../../../../../api/queries/settings/useProvidersQueries'
import InlineButton from '../../../../ui/buttons/InlineButton'
import ErrorMessage from '../../../../ui/feedback/ErrorMessage'
import ApiKeyForm from './ApiKeyForm'

interface ApiKeySectionProps {
  providerName: string
  hasApiKey: boolean
}

export default function ApiKeySection({
  providerName,
  hasApiKey,
}: ApiKeySectionProps) {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { mutate: deleteApiKey } = useDeleteApiKey()

  function handleDelete() {
    setDeleteError(null)
    deleteApiKey(providerName, {
      onError: () => {
        setDeleteError(t('settings.providers.removeApiKeyFailed'))
      },
    })
  }

  if (hasApiKey) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-8">
          <span className="font-ubuntu text-base text-green-600 dark:text-green-400">
            {t('settings.providers.apiKeyAdded')}
          </span>
          <button
            onClick={handleDelete}
            className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-red-500 hover:bg-red-300 hover:text-red-700"
          >
            {t('settings.providers.removeApiKey')}
          </button>
        </div>
        {deleteError && <ErrorMessage message={deleteError} />}
      </div>
    )
  }

  if (isAdding) {
    return (
      <ApiKeyForm
        providerName={providerName}
        onClose={() => setIsAdding(false)}
      />
    )
  }

  return (
    <InlineButton onClick={() => setIsAdding(true)}>
      {t('settings.providers.addApiKey')}
    </InlineButton>
  )
}
