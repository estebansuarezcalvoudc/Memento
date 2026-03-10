import { type InputHTMLAttributes } from 'react'

interface InlineInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function InlineInput({ className = '', ...props }: InlineInputProps) {
  return (
    <input
      className={`font-ubuntu h-8 rounded-lg border border-stone-300 bg-transparent px-3 text-base text-stone-800 outline-none focus:border-stone-500 ${className}`}
      {...props}
    />
  )
}
