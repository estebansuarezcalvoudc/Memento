interface ConfirmButtonProps {
  label?: string
  pendingLabel?: string
  isPending?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
}

export default function ConfirmButton({
  label = 'Confirm',
  pendingLabel = 'Saving...',
  isPending = false,
  disabled = false,
  type = 'submit',
  onClick,
}: ConfirmButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      onClick={onClick}
      className="font-ubuntu h-8 cursor-pointer rounded-lg bg-lime-400 px-3 text-sm text-stone-800 hover:bg-lime-500 disabled:opacity-50"
    >
      {isPending ? pendingLabel : label}
    </button>
  )
}
