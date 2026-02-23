import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

export default function Select({ label, children, ...props }: SelectProps) {
  const id = useId()

  return (
    <div className="mt-3 flex flex-col align-middle">
      <label
        htmlFor={id}
        className="font-ubuntu mb-1 ml-1 items-center justify-center text-stone-600"
      >
        {label}
      </label>
      <select
        id={id}
        className="font-ubuntu h-8 rounded-lg bg-stone-300 px-2 text-base text-stone-800"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
