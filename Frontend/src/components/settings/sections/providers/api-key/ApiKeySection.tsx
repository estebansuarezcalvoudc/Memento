import { useState } from 'react'

import DangerButton from '../../../../ui/buttons/DangerButton'
import InlineButton from '../../../../ui/buttons/InlineButton'
import ErrorMessage from '../../../../ui/feedback/ErrorMessage'
import ApiKeyForm from './ApiKeyForm'

interface ApiKeySectionProps {
  providerName: string
  hasApiKey: boolean
  addApiKey: (providerName: string, apiKey: string) => Promise<void>
  deleteApiKey: (providerName: string) => Promise<void>
  addLabel: string
  removeLabel: string
  addedLabel: string
  invalidApiKeyMessage: string
  deleteApiKeyFailedMessage: string
  apiKeyPlaceholder: string
  apiKeyEmptyError: string
}

export default function ApiKeySection({
  providerName,
  hasApiKey,
  addApiKey,
  deleteApiKey,
  addLabel,
  removeLabel,
  addedLabel,
  invalidApiKeyMessage,
  deleteApiKeyFailedMessage,
  apiKeyPlaceholder,
  apiKeyEmptyError,
}: ApiKeySectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function handleDelete() {
    setDeleteError(null)
    deleteApiKey(providerName).catch(() => {
      setDeleteError(deleteApiKeyFailedMessage)
    })
  }

  if (hasApiKey) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-8">
          <span className="font-ubuntu text-base text-green-600 dark:text-green-400">
            {addedLabel}
          </span>
          <DangerButton onClick={handleDelete}>{removeLabel}</DangerButton>
        </div>
        {deleteError && <ErrorMessage message={deleteError} />}
      </div>
    )
  }

  if (isAdding) {
    return (
      <ApiKeyForm
        invalidApiKeyMessage={invalidApiKeyMessage}
        onSubmitApiKey={apiKey => addApiKey(providerName, apiKey)}
        onClose={() => setIsAdding(false)}
        apiKeyPlaceholder={apiKeyPlaceholder}
        apiKeyEmptyError={apiKeyEmptyError}
      />
    )
  }

  return (
    <InlineButton onClick={() => setIsAdding(true)}>{addLabel}</InlineButton>
  )
}
