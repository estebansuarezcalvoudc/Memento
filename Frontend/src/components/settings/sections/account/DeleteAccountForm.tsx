import { useActionState } from 'react'

import { useDeleteAccount } from '../../../../api/queries/auth/useAuthQueries'
import Input from '../../../common/Input'
import CancelButton from '../ui/CancelButton'
import ConfirmButton from '../ui/ConfirmButton'
import ErrorMessage from '../ui/ErrorMessage'

interface FormState {
  errors: null | string[]
}

interface DeleteAccountFormProps {
  onClose: () => void
}

export default function DeleteAccountForm({ onClose }: DeleteAccountFormProps) {
  const { mutateAsync: deleteAccount } = useDeleteAccount()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      deleteAccountAction(prev, formData, deleteAccount, onClose),
    { errors: null },
  )
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Input name="password" type="password" label="Password" />
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
      <div className="mt-4 flex justify-center gap-x-2">
        <CancelButton onClick={onClose} disabled={isPending} />
        <ConfirmButton label="Delete" color="red" isPending={isPending} />
      </div>
    </form>
  )
}

async function deleteAccountAction(
  _prev: FormState,
  formData: FormData,
  deleteAccount: (vars: { password: string }) => Promise<null>,
  onClose: () => void,
): Promise<FormState> {
  const password = (formData.get('password') ?? '') as string

  if (!password.trim()) {
    return { errors: ['Password cannot be empty'] }
  }

  try {
    await deleteAccount({ password })
    onClose()
    return { errors: null }
  } catch (error) {
    return {
      errors: [
        error instanceof Error ? error.message : 'Failed to delete account',
      ],
    }
  }
}
