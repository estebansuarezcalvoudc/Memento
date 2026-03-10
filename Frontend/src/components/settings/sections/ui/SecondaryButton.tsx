interface SecondaryButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

export default function SecondaryButton({
  onClick,
  disabled = false,
  label = 'Cancel',
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-ubuntu h-8 cursor-pointer rounded-lg px-3 text-base text-stone-500 hover:bg-stone-300 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-100"
    >
      {label}
    </button>
  )
}
