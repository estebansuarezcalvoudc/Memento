import { useActionState } from 'react'

import CancelButton from '../ui/CancelButton'
import ConfirmButton from '../ui/ConfirmButton'
import ErrorMessage from '../ui/ErrorMessage'

interface FormState {
  errors: null | string[]
}

interface ProviderInlineFormProps {
  inputName: string
  placeholder: string
  emptyError: string
  onSubmit: (value: string) => Promise<void>
  onClose: () => void
}

export default function ProviderInlineForm({
  inputName,
  placeholder,
  emptyError,
  onSubmit,
  onClose,
}: ProviderInlineFormProps) {
  const [formState, formAction, isPending] = useActionState<FormState, FormData>(
    (prev, formData) =>
      providerInlineFormAction(prev, formData, inputName, emptyError, onSubmit, onClose),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          name={inputName}
          type="text"
          placeholder={placeholder}
          className="font-ubuntu h-8 min-w-48 flex-1 rounded-lg border border-stone-300 bg-transparent px-3 text-base text-stone-800 outline-none focus:border-stone-500"
        />
        <ConfirmButton isPending={isPending} />
        <CancelButton onClick={onClose} />
      </div>
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
    </form>
  )
}

async function providerInlineFormAction(
  _prev: FormState,
  formData: FormData,
  inputName: string,
  emptyError: string,
  onSubmit: (value: string) => Promise<void>,
  onClose: () => void,
): Promise<FormState> {
  const value = (formData.get(inputName) ?? '') as string
  if (!value.trim()) {
    return { errors: [emptyError] }
  }
  try {
    await onSubmit(value)
    onClose()
    return { errors: null }
  } catch (error) {
    return {
      errors: [error instanceof Error ? error.message : 'Something went wrong'],
    }
  }
}
