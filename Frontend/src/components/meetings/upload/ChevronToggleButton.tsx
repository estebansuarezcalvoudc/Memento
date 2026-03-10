const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
)

interface ChevronToggleButtonProps {
  isExpanded: boolean
  onClick: () => void
  disabled: boolean
}

export default function ChevronToggleButton({
  isExpanded,
  onClick,
  disabled,
}: ChevronToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="toggle options"
      aria-expanded={isExpanded}
      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 transition-colors disabled:opacity-30 ${
        isExpanded
          ? 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
          : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300'
      }`}
    >
      <span
        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      >
        <ChevronIcon />
      </span>
    </button>
  )
}
