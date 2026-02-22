import { useState } from 'react'

import { useDeleteApiKey } from '../../../../api/queries/settings/useProvidersQueries'
import ApiKeyForm from './ApiKeyForm'

interface ApiKeySectionProps {
  providerName: string
  hasApiKey: boolean
}

export default function ApiKeySection({
  providerName,
  hasApiKey,
}: ApiKeySectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { mutateAsync: deleteApiKey } = useDeleteApiKey()

  if (hasApiKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-ubuntu text-sm text-green-600">
          ✓ API key added
        </span>
        <button
          onClick={() => deleteApiKey(providerName)}
          className="font-ubuntu text-sm text-red-500 hover:text-red-700"
        >
          Delete
        </button>
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
    <button
      onClick={() => setIsAdding(true)}
      className="font-ubuntu w-fit text-sm text-stone-500 underline hover:text-stone-800"
    >
      Add API key
    </button>
  )
}
