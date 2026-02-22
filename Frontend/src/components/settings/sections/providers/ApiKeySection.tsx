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
      <div className="flex items-center gap-8">
        <span className="font-ubuntu text-base text-green-600">
          API key added
        </span>
        <button
          onClick={() => deleteApiKey(providerName)}
          className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-red-500 hover:bg-red-300 hover:text-red-700"
        >
          Remove API key
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
      className="font-ubuntu w-fit cursor-pointer text-sm text-stone-500 underline hover:text-stone-800"
    >
      Add API key
    </button>
  )
}
