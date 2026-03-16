import { type InputHTMLAttributes } from 'react'

type InlineInputProps = InputHTMLAttributes<HTMLInputElement>

export default function InlineInput({
  className = '',
  ...props
}: InlineInputProps) {
  return (
    <input
      className={`font-ubuntu h-8 rounded-lg border border-stone-300 bg-transparent px-3 text-base text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus:border-stone-400 ${className}`}
      {...props}
    />
  )
}
