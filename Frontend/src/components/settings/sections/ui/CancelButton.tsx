interface CancelButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

export default function CancelButton({
  onClick,
  disabled = false,
  label = 'Cancel',
}: CancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-ubuntu h-8 cursor-pointer rounded-lg px-3 text-base text-stone-500 hover:bg-stone-300 hover:text-stone-800 disabled:opacity-50"
    >
      {label}
    </button>
  )
}
