interface DangerButtonProps {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

export default function DangerButton({
  onClick,
  children,
  disabled = false,
}: DangerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-red-500 hover:bg-red-300 hover:text-red-700 disabled:cursor-default disabled:opacity-40 dark:hover:bg-red-900 dark:hover:text-red-300"
    >
      {children}
    </button>
  )
}
