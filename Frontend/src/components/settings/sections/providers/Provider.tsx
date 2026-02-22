import { useActionState, useState } from 'react'

import { useUploadApiKey, useDeleteApiKey } from '../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'
import { type Provider } from '../../../../types/settings/providers'
import FormButton from '../../../common/FormButton'
import Input from '../../../common/Input'

interface FormState {
  errors: null | string[]
}

export default function Provider({ provider }: { provider: Provider }) {
  const [hasKey, setHasKey] = useState(provider.hasApiKey ?? false)
  const [isAdding, setIsAdding] = useState(false)

  const { mutateAsync: uploadApiKey } = useUploadApiKey()
  const { mutateAsync: deleteApiKey } = useDeleteApiKey()

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
      <span className="font-ubuntu text-lg text-stone-800">{provider.name}</span>

      {provider.requiresApiKey && (
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
            <div className="flex items-end gap-2">
              <Input label="API Key" name="apiKey" type="text" placeholder="Enter your API key" />
              <FormButton isPending={isPending} text="Confirm" classes="mb-[3px]" />
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="font-ubuntu mb-[3px] h-8 rounded-lg px-4 text-sm text-stone-600 hover:text-stone-800"
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
      )}
    </div>
  )
}
