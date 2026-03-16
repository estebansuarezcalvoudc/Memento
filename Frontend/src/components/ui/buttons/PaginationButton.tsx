interface PaginationButtonProps {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
  active?: boolean
}

export default function PaginationButton({
  onClick,
  children,
  disabled = false,
  active = false,
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 min-w-[2rem] cursor-pointer items-center justify-center rounded-md border px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-stone-500 bg-stone-200 font-medium text-stone-800 dark:border-stone-400 dark:bg-stone-700 dark:text-stone-100'
          : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:bg-stone-800'
      }`}
    >
      {children}
    </button>
  )
}
