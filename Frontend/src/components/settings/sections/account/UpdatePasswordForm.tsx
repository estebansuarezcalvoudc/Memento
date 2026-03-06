import { useActionState } from 'react'

import { useUpdatePassword } from '../../../../api/queries/auth/useAuthQueries'
import Input from '../../../common/Input'
import CancelButton from '../ui/CancelButton'
import ConfirmButton from '../ui/ConfirmButton'
import ErrorMessage from '../ui/ErrorMessage'

interface FormState {
  errors: null | string[]
}

interface UpdatePasswordFormProps {
  onClose: () => void
}

export default function UpdatePasswordForm({
  onClose,
}: UpdatePasswordFormProps) {
  const { mutateAsync: updatePassword } = useUpdatePassword()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      updatePasswordAction(prev, formData, updatePassword, onClose),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Input name="currentPassword" type="password" label="Current password" />
      <Input name="newPassword" type="password" label="New password" />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirm new password"
      />
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
      <div className="mt-4 flex justify-center gap-x-2">
        <CancelButton onClick={onClose} disabled={isPending} />
        <ConfirmButton label="Save" isPending={isPending} />
      </div>
    </form>
  )
}

async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
  updatePassword: (vars: {
    currentPassword: string
    newPassword: string
  }) => Promise<null>,
  onClose: () => void,
): Promise<FormState> {
  const currentPassword = (formData.get('currentPassword') ?? '') as string
  const newPassword = (formData.get('newPassword') ?? '') as string
  const confirmPassword = (formData.get('confirmPassword') ?? '') as string

  if (!currentPassword.trim()) {
    return { errors: ['Current password cannot be empty'] }
  }
  if (!newPassword.trim()) {
    return { errors: ['New password cannot be empty'] }
  }
  if (newPassword !== confirmPassword) {
    return { errors: ['New passwords do not match'] }
  }

  try {
    await updatePassword({ currentPassword, newPassword })
    onClose()
    return { errors: null }
  } catch (error) {
    return {
      errors: [
        error instanceof Error ? error.message : 'Failed to update password',
      ],
    }
  }
}
