import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'

import { useUpdatePassword } from '../../../../api/queries/auth/useAuthQueries'
import Input from '../../../common/Input'
import ConfirmButton from '../ui/ConfirmButton'
import ErrorMessage from '../ui/ErrorMessage'
import SecondaryButton from '../ui/SecondaryButton'

interface FormState {
  errors: null | string[]
}

interface UpdatePasswordFormProps {
  onClose: () => void
}

export default function UpdatePasswordForm({
  onClose,
}: UpdatePasswordFormProps) {
  const { t } = useTranslation()
  const { mutateAsync: updatePassword } = useUpdatePassword()

  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      updatePasswordAction(prev, formData, updatePassword, onClose, t),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Input
        name="currentPassword"
        type="password"
        label={t('settings.account.updatePassword.currentPassword')}
      />
      <Input
        name="newPassword"
        type="password"
        label={t('settings.account.updatePassword.newPassword')}
      />
      <Input
        name="confirmPassword"
        type="password"
        label={t('settings.account.updatePassword.confirmNewPassword')}
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

async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
  updatePassword: (vars: {
    currentPassword: string
    newPassword: string
  }) => Promise<null>,
  onClose: () => void,
  t: (key: string) => string,
): Promise<FormState> {
  const currentPassword = (formData.get('currentPassword') ?? '') as string
  const newPassword = (formData.get('newPassword') ?? '') as string
  const confirmPassword = (formData.get('confirmPassword') ?? '') as string

  if (!currentPassword.trim()) {
    return {
      errors: [t('settings.account.updatePassword.currentPasswordRequired')],
    }
  }
  if (!newPassword.trim()) {
    return {
      errors: [t('settings.account.updatePassword.newPasswordRequired')],
    }
  }
  if (newPassword !== confirmPassword) {
    return { errors: [t('settings.account.updatePassword.passwordsMismatch')] }
  }

  try {
    await updatePassword({ currentPassword, newPassword })
    onClose()
    return { errors: null }
  } catch (error) {
    return {
      errors: [
        error instanceof Error
          ? error.message
          : t('settings.account.updatePassword.failed'),
      ],
    }
  }
}
