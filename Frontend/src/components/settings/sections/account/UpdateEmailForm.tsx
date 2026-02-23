import { useActionState } from 'react'

import { useUpdateUsername } from '../../../../api/queries/auth/useAuthQueries'
import { HttpError } from '../../../../api/utils/fetchBackend'
import Input from '../../../common/Input'
import CancelButton from '../CancelButton'
import ConfirmButton from '../ConfirmButton'
import ErrorMessage from '../ErrorMessage'

interface FormState {
  errors: null | string[]
}

interface UpdateEmailFormProps {
  onClose: () => void
  onSuccess: (newUsername: string) => void
}

export default function UpdateEmailForm({ onClose, onSuccess }: UpdateEmailFormProps) {
  const { mutateAsync: updateUsername } = useUpdateUsername()

  const [formState, formAction, isPending] = useActionState<FormState, FormData>(
    (prev, formData) => updateEmailAction(prev, formData, updateUsername, onSuccess),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="newEmail" type="email" label="New email" />
      <Input name="password" type="password" label="Password" />
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
      <div className="flex justify-center gap-2">
        <ConfirmButton label="Save" isPending={isPending} />
        <CancelButton onClick={onClose} disabled={isPending} />
      </div>
    </form>
  )
}

async function updateEmailAction(
  _prev: FormState,
  formData: FormData,
  updateUsername: (vars: { newUsername: string; password: string }) => Promise<{ accessToken: string; token_type: string }>,
  onSuccess: (newUsername: string) => void,
): Promise<FormState> {
  const newEmail = (formData.get('newEmail') ?? '') as string
  const password = (formData.get('password') ?? '') as string

  if (!newEmail.trim()) return { errors: ['New email cannot be empty'] }
  if (!password.trim()) return { errors: ['Password cannot be empty'] }

  try {
    const token = await updateUsername({ newUsername: newEmail, password })
    localStorage.setItem('access_token', token.accessToken)
    onSuccess(newEmail)
    return { errors: null }
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return { errors: ['Incorrect password'] }
    }
    if (error instanceof HttpError && error.status === 400) {
      return { errors: ['A user with this email already exists'] }
    }
    return { errors: [error instanceof Error ? error.message : 'Failed to update email'] }
  }
}

