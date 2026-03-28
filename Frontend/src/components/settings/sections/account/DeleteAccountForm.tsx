import { useActionState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import {
  useDeleteAccount,
  useGetAccountDeletionPolicy,
} from '../../../../api/queries/auth/useAuthQueries'
import { clearAuthSession } from '../../../../auth/session'
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
  const deletionPolicyQuery = useGetAccountDeletionPolicy()
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
      {deletionPolicyQuery.isPending ? (
        <span className="font-ubuntu mb-1 text-sm text-stone-600 dark:text-stone-400">
          {t('settings.account.deleteAccountForm.loadingPolicy')}
        </span>
      ) : null}

      {deletionPolicyQuery.isSuccess ? (
        <div className="font-ubuntu mt-6 mb-2 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p>
            <Trans
              i18nKey="settings.account.deleteAccountForm.retentionNotice"
              values={{ days: deletionPolicyQuery.data.graceDays }}
              components={{ bold: <strong /> }}
            />
          </p>
          <p>
            <Trans
              i18nKey="settings.account.deleteAccountForm.contactNotice"
              values={{ email: deletionPolicyQuery.data.contactEmail }}
              components={{ bold: <strong /> }}
            />
          </p>
        </div>
      ) : null}

      {deletionPolicyQuery.isError ? (
        <ErrorMessage
          message={t('settings.account.deleteAccountForm.policyLoadFailed')}
        />
      ) : null}

      <Input
        name="password"
        type="password"
        label={t('settings.account.deleteAccountForm.password')}
        disabled={deletionPolicyQuery.isError}
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
          disabled={deletionPolicyQuery.isError}
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
    clearAuthSession()
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
