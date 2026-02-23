interface CancelButtonProps {
  onClick: () => void
  disabled?: boolean
}

export default function CancelButton({ onClick, disabled = false }: CancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-ubuntu h-8 cursor-pointer rounded-lg px-3 text-sm text-stone-500 hover:bg-stone-300 hover:text-stone-800 disabled:opacity-50"
    >
      Cancel
    </button>
  )
}
