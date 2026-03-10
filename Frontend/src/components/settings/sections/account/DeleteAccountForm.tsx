import { useActionState } from 'react'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import { useDeleteAccount } from '../../../../api/queries/auth/useAuthQueries'
import {
  useSetIsUserAuth,
  type SetIsUserAuth,
} from '../../../../stores/authStore'
import Input from '../../../common/Input'
import SecondaryButton from '../ui/SecondaryButton'
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
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      deleteAccountAction(
        prev,
        formData,
        deleteAccount,
        navigate,
        setIsUserAuth,
      ),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Input name="password" type="password" label="Password" />
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
      <div className="mt-4 flex justify-center gap-x-2">
        <SecondaryButton onClick={onClose} disabled={isPending} />
        <ConfirmButton label="Delete" color="red" isPending={isPending} />
      </div>
    </form>
  )
}

async function deleteAccountAction(
  _prev: FormState,
  formData: FormData,
  deleteAccount: (vars: { password: string }) => Promise<null>,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
): Promise<FormState> {
  const password = (formData.get('password') ?? '') as string

  if (!password.trim()) {
    return { errors: ['Password cannot be empty'] }
  }

  try {
    await deleteAccount({ password })
    localStorage.removeItem('access_token')
    setIsUserAuth(false)
    navigate('/')
    return { errors: null }
  } catch (error) {
    return {
      errors: [
        error instanceof Error ? error.message : 'Failed to delete account',
      ],
    }
  }
}
