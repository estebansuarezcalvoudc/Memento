import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'

import { useUpdateUsername } from '../../../../api/queries/auth/useAuthQueries'
import ConfirmButton from '../../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../../ui/buttons/SecondaryButton'
import ErrorMessage from '../../../ui/feedback/ErrorMessage'
import Input from '../../../ui/inputs/Input'

interface FormState {
  errors: null | string[]
}

interface UpdateEmailFormProps {
  onClose: () => void
  onSuccess: (newUsername: string) => void
}

export default function UpdateEmailForm({
  onClose,
  onSuccess,
}: UpdateEmailFormProps) {
  const { t } = useTranslation()
  const { mutateAsync: updateUsername } = useUpdateUsername()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      updateEmailAction(prev, formData, updateUsername, onSuccess, t),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Input
        name="newEmail"
        type="email"
        label={t('settings.account.updateEmail.newEmail')}
      />
      <Input
        name="password"
        type="password"
        label={t('settings.account.updateEmail.password')}
      />
      {formState.errors && <ErrorMessage message={formState.errors[0]} />}
      <div className="mt-4 flex justify-center gap-x-2">
        <SecondaryButton
          onClick={onClose}
          disabled={isPending}
          label={t('settings.buttons.cancel')}
        />
        <ConfirmButton
          label={t('settings.buttons.save')}
          isPending={isPending}
          pendingLabel={t('settings.buttons.saving')}
        />
      </div>
    </form>
  )
}

async function updateEmailAction(
  _prev: FormState,
  formData: FormData,
  updateUsername: (vars: {
    newUsername: string
    password: string
  }) => Promise<{ accessToken: string; token_type: string }>,
  onSuccess: (newUsername: string) => void,
  t: (key: string) => string,
): Promise<FormState> {
  const newEmail = (formData.get('newEmail') ?? '') as string
  const password = (formData.get('password') ?? '') as string

  if (!newEmail.trim()) {
    return { errors: [t('settings.account.updateEmail.newEmailRequired')] }
  }
  if (!password.trim()) {
    return { errors: [t('settings.account.updateEmail.passwordRequired')] }
  }

  try {
    const token = await updateUsername({ newUsername: newEmail, password })
    localStorage.setItem('access_token', token.accessToken)
    onSuccess(newEmail)
    return { errors: null }
  } catch (error) {
    return {
      errors: [
        error instanceof Error
          ? error.message
          : t('settings.account.updateEmail.failed'),
      ],
    }
  }
}
