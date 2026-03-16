import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'

import ConfirmButton from '../../../ui/buttons/ConfirmButton'
import SecondaryButton from '../../../ui/buttons/SecondaryButton'
import ErrorMessage from '../../../ui/feedback/ErrorMessage'
import InlineInput from '../../../ui/inputs/InlineInput'

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
  const { t } = useTranslation()
  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prev, formData) =>
      providerInlineFormAction(
        prev,
        formData,
        inputName,
        emptyError,
        onSubmit,
        onClose,
        t,
      ),
    { errors: null },
  )

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <InlineInput
          name={inputName}
          type="text"
          placeholder={placeholder}
          className="min-w-48 flex-1"
        />
        <ConfirmButton
          isPending={isPending}
          pendingLabel={t('settings.buttons.saving')}
        />
        <SecondaryButton
          onClick={onClose}
          label={t('settings.buttons.cancel')}
        />
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
  t: (key: string) => string,
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
      errors: [
        error instanceof Error ? error.message : t('common.somethingWentWrong'),
      ],
    }
  }
}
