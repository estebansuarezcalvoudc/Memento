import { type InputHTMLAttributes } from 'react'

interface InlineInputProps extends InputHTMLAttributes<HTMLInputElement> {
  px?: string
}

export default function InlineInput({
  className = '',
  px = 'px-3',
  ...props
}: InlineInputProps) {
  return (
    <input
      className={`font-ubuntu h-8 rounded-lg border border-stone-300 bg-transparent text-base text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus:border-stone-400 ${className} ${px}`}
      {...props}
    />
  )
}
