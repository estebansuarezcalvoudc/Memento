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
  label = 'Confirm',
  color = 'lime',
  pendingLabel = 'Saving...',
  isPending = false,
  disabled = false,
  type = 'submit',
  onClick,
}: ConfirmButtonProps) {
  const bgColor =
    color === 'lime'
      ? 'bg-lime-400 hover:bg-lime-500 text-stone-800'
      : 'bg-red-500 hover:bg-red-700 text-stone-50'

  return (
    <button
      type={type}
      disabled={disabled || isPending}
      onClick={onClick}
      className={`font-ubuntu h-8 cursor-pointer rounded-lg ${bgColor} px-3 text-base disabled:opacity-50`}
    >
      {isPending ? pendingLabel : label}
    </button>
  )
}
