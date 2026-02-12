import { useId, type SelectHTMLAttributes } from 'react'

interface SelectProps<T> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label: string
  options: T[]
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  getOptionValue: (option: T) => string
  getOptionLabel: (option: T) => string
}

function Select<T>({
  label,
  options,
  placeholder,
  value,
  onChange,
  getOptionValue,
  getOptionLabel,
  ...props
}: SelectProps<T>) {
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
        value={value}
        onChange={e => onChange?.(e.target.value)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={getOptionValue(option)} value={getOptionValue(option)}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select
