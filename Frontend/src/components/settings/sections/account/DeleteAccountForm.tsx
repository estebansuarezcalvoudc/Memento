import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import { useDeleteAccount } from '../../../../api/queries/auth/useAuthQueries'
import {
  useSetIsUserAuth,
  type SetIsUserAuth,
} from '../../../../stores/authStore'
import ConfirmButton from '../../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../../ui/buttons/SecondaryButton'
import ErrorMessage from '../../../ui/feedback/ErrorMessage'
import Input from '../../../ui/inputs/Input'

interface FormState {
  errors: null | string[]
}

interface DeleteAccountFormProps {
  onClose: () => void
}

export default function DeleteAccountForm({ onClose }: DeleteAccountFormProps) {
  const { t } = useTranslation()
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
        t,
      ),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Input
        name="password"
        type="password"
        label={t('settings.account.deleteAccountForm.password')}
      />
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
      <div className="mt-4 flex justify-center gap-x-2">
        <SecondaryButton
          onClick={onClose}
          disabled={isPending}
          label={t('settings.buttons.cancel')}
        />
        <ConfirmButton
          label={t('settings.buttons.delete')}
          color="red"
          isPending={isPending}
          pendingLabel={t('settings.buttons.saving')}
        />
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
  t: (key: string) => string,
): Promise<FormState> {
  const password = (formData.get('password') ?? '') as string

  if (!password.trim()) {
    return {
      errors: [t('settings.account.deleteAccountForm.passwordRequired')],
    }
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
        error instanceof Error
          ? error.message
          : t('settings.account.deleteAccountForm.failed'),
      ],
    }
  }
}
