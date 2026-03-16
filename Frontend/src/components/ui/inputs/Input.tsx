import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  containerClassName?: string
  startIcon?: ReactNode
}

export default function Input({
  label,
  containerClassName,
  startIcon,
  className,
  ...props
}: InputProps) {
  const id = useId()

  return (
    <div className={`flex flex-col ${containerClassName ?? 'mt-3'}`}>
      <label
        htmlFor={id}
        className="font-ubuntu mb-1 ml-1 items-center justify-center text-sm text-stone-600 dark:text-stone-400"
      >
        {label}
      </label>
      <div className="relative">
        {startIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-stone-400 dark:text-stone-500">
            {startIcon}
          </span>
        )}
        <input
          id={id}
          className={`font-ubuntu h-8 w-full rounded-lg border border-stone-300 bg-transparent px-3 text-base text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus:border-stone-400${className ? ` ${className}` : ''}`}
          {...props}
        />
      </div>
    </div>
  )
}
