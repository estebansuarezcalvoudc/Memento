import { useState } from 'react'

import { useDeleteApiKey } from '../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'
import ErrorMessage from '../ErrorMessage'
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
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { mutate: deleteApiKey } = useDeleteApiKey()

  function handleDelete() {
    setDeleteError(null)
    deleteApiKey(providerName, {
      onError: err => {
        if (err instanceof HttpError && err.status === 400) {
          setDeleteError('Cannot remove the API key of the last active provider')
        } else {
          setDeleteError('Failed to remove API key. Please try again.')
        }
      },
    })
  }

  if (hasApiKey) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-8">
          <span className="font-ubuntu text-base text-green-600">
            API key added
          </span>
          <button
            onClick={handleDelete}
            className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-red-500 hover:bg-red-300 hover:text-red-700"
          >
            Remove API key
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
    <button
      onClick={() => setIsAdding(true)}
      className="font-ubuntu w-fit cursor-pointer text-sm text-stone-500 underline hover:text-stone-800"
    >
      Add API key
    </button>
  )
}
