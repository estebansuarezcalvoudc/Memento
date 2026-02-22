import { useId, type SelectHTMLAttributes } from 'react'

interface SelectOption {
  code: string
  name: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  placeholder?: string
}

export default function Select({
  label,
  options,
  placeholder = 'Select an option',
  ...props
}: SelectProps) {
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
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}
