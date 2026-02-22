import { useActionState, useState } from 'react'

import { useUploadApiKey, useDeleteApiKey, useUpdateProviderStatus } from '../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'
import { type Provider } from '../../../../types/settings/providers'
import Toggle from '../../../common/Toggle'

interface FormState {
  errors: null | string[]
}

export default function Provider({ provider }: { provider: Provider }) {
  const [hasKey, setHasKey] = useState(provider.hasApiKey ?? false)
  const [isAdding, setIsAdding] = useState(false)

  const { mutateAsync: uploadApiKey } = useUploadApiKey()
  const { mutateAsync: deleteApiKey } = useDeleteApiKey()

  const [isActive, setIsActive] = useState(provider.active)
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateProviderStatus()

  function handleToggle(enabled: boolean) {
    setIsActive(enabled)
    updateStatus({ providerName: provider.name, active: enabled })
  }

  const [formState, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const apiKey = (formData.get('apiKey') ?? '') as string
      if (!apiKey.trim()) return { errors: ['API key cannot be empty'] }
      try {
        await uploadApiKey({ providerName: provider.name, apiKey })
        setHasKey(true)
        setIsAdding(false)
        return { errors: null }
      } catch (error) {
        if (error instanceof HttpError && error.status === 401)
          return { errors: ['Invalid API key'] }
        return { errors: [error instanceof Error ? error.message : 'Failed to save API key'] }
      }
    },
    { errors: null },
  )

  async function handleDelete() {
    await deleteApiKey(provider.name)
    setHasKey(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-ubuntu text-lg text-stone-800">{provider.name}</span>
        <Toggle enabled={isActive} onChange={handleToggle} disabled={isUpdatingStatus} />
      </div>

      {provider.requiresApiKey ? (
        hasKey ? (
          <div className="flex items-center gap-3">
            <span className="font-ubuntu text-sm text-green-600">✓ API key added</span>
            <button
              onClick={handleDelete}
              className="font-ubuntu text-sm text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ) : isAdding ? (
          <form action={formAction} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                name="apiKey"
                type="text"
                placeholder="Enter your API key"
                className="font-ubuntu h-8 flex-1 rounded-md border border-stone-300 bg-transparent px-3 text-sm text-stone-800 outline-none focus:border-stone-500"
              />
              <button
                type="submit"
                disabled={isPending}
                className="font-ubuntu h-8 rounded-md bg-stone-800 px-3 text-sm text-white disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="font-ubuntu h-8 rounded-md px-3 text-sm text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            </div>
            {formState.errors && (
              <span className="font-ubuntu text-sm text-red-500">{formState.errors[0]}</span>
            )}
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="font-ubuntu w-fit text-sm text-stone-500 hover:text-stone-800 underline"
          >
            + Add API key
          </button>
        )
      ) : <span>Does not require API key</span>}
    </div>
  )
}
