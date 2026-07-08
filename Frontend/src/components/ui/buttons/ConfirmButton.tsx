import { useTranslation } from 'react-i18next'

interface ConfirmButtonProps {
  label?: string
  color?: 'lime' | 'red'
  pendingLabel?: string
  isPending?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
}

export default function ConfirmButton({
  label,
  color = 'lime',
  pendingLabel,
  isPending = false,
  disabled = false,
  type = 'submit',
  onClick,
}: ConfirmButtonProps) {
  const { t } = useTranslation()
  const resolvedLabel = label ?? t('settings.buttons.confirm')
  const resolvedPendingLabel = pendingLabel ?? t('settings.buttons.saving')

  const bgColor =
    color === 'lime'
      ? 'bg-blue-400 hover:bg-blue-500 text-stone-800 dark:text-white hover:text-black'
      : 'bg-red-500 hover:bg-red-700 text-stone-50'

  return (
    <button
      type={type}
      disabled={disabled || isPending}
      onClick={onClick}
      className={`font-ubuntu h-8 cursor-pointer rounded-lg ${bgColor} px-3 text-base disabled:opacity-50`}
    >
      {isPending ? resolvedPendingLabel : resolvedLabel}
    </button>
  )
}
