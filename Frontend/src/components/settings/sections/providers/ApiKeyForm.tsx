import { useActionState } from 'react'

import { useUploadApiKey } from '../../../../api/queries/settings/useProvidersQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'

interface FormState {
  errors: null | string[]
}

interface ApiKeyFormProps {
  providerName: string
  onClose: () => void
}

export default function ApiKeyForm({ providerName, onClose }: ApiKeyFormProps) {
  const { mutateAsync: uploadApiKey } = useUploadApiKey()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      uploadApiKeyAction(prev, formData, providerName, uploadApiKey, onClose),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          name="apiKey"
          type="text"
          placeholder="Enter your API key"
          className="font-ubuntu h-8 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 text-sm text-stone-800 outline-none focus:border-stone-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="font-ubuntu h-8 cursor-pointer rounded-lg bg-lime-400 hover:bg-lime-500 px-3 text-sm text-stone-800 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="font-ubuntu h-8 cursor-pointer rounded-lg px-3 hover:bg-stone-300 text-sm text-stone-500 hover:text-stone-800"
        >
          Cancel
        </button>
      </div>
      {formState.errors && (
        <span className="font-ubuntu text-sm text-red-500">
          {formState.errors[0]}
        </span>
      )}
    </form>
  )
}

async function uploadApiKeyAction(
  _prev: FormState,
  formData: FormData,
  providerName: string,
  uploadApiKey: (vars: {
    providerName: string
    apiKey: string
  }) => Promise<null>,
  onClose: () => void,
): Promise<FormState> {
  const apiKey = (formData.get('apiKey') ?? '') as string
  if (!apiKey.trim()) {
    return { errors: ['API key cannot be empty'] }
  }
  try {
    await uploadApiKey({ providerName, apiKey })
    onClose()
    return { errors: null }
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return { errors: ['Invalid API key'] }
    }
    return {
      errors: [
        error instanceof Error ? error.message : 'Failed to save API key',
      ],
    }
  }
}
