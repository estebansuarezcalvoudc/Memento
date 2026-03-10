import { useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, ...props }: InputProps) {
  const id = useId()

  return (
    <div className="mt-3 flex flex-col align-middle">
      <label
        htmlFor={id}
        className="font-ubuntu mb-1 ml-1 items-center justify-center text-base text-stone-600 dark:text-stone-400"
      >
        {label}
      </label>
      <input
        id={id}
        className={`font-ubuntu h-8 w-full rounded-lg border border-stone-300 bg-transparent px-3 text-base text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus:border-stone-400`}
        {...props}
      />
    </div>
  )
}
