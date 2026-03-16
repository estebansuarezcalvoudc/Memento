type InlineButtonVariant = 'default' | 'emphasis' | 'danger'

const variantClasses: Record<InlineButtonVariant, string> = {
  default:
    'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100',
  emphasis:
    'text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100',
  danger: 'text-red-500 hover:text-red-800',
}

interface InlineButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: InlineButtonVariant
}

export default function InlineButton({
  onClick,
  children,
  variant = 'default',
}: InlineButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base underline ${variantClasses[variant]}`}
    >
      {children}
    </button>
  )
}
