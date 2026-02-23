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
        className="font-ubuntu mb-1 ml-1 items-center justify-center text-stone-600"
      >
        {label}
      </label>
      <input
        id={id}
        className={`font-ubuntu flex h-8 cursor-pointer items-center rounded-lg bg-stone-300 px-2 text-base text-stone-800 file:m-0 file:mr-2 file:h-full file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-stone-800`}
        {...props}
      />
    </div>
  )
}
