import {
  useId,
  useState,
  type ChangeEventHandler,
  type InputHTMLAttributes,
} from 'react'
import { useTranslation } from 'react-i18next'

type FilePickerInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function FilePickerInput({
  className = '',
  disabled,
  onChange,
  ...props
}: FilePickerInputProps) {
  const inputId = useId()
  const [selectedFileName, setSelectedFileName] = useState('')
  const { t } = useTranslation()

  const handleChange: ChangeEventHandler<HTMLInputElement> = event => {
    const file = event.target.files?.[0]
    setSelectedFileName(file?.name ?? '')
    onChange?.(event)
  }

  return (
    <div
      className={`font-ubuntu flex h-8 w-full items-center gap-2 rounded-lg border border-stone-300 bg-transparent px-1.5 text-base text-stone-800 focus-within:border-stone-500 dark:border-stone-600 dark:text-stone-100 dark:focus-within:border-stone-400 ${className}`}
    >
      <input
        id={inputId}
        type="file"
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />

      <label
        htmlFor={inputId}
        className={`inline-flex h-5 shrink-0 items-center justify-center rounded-md border px-1.5 text-xs transition-colors ${
          disabled
            ? 'cursor-not-allowed border-stone-300 text-stone-400 dark:border-stone-600 dark:text-stone-500'
            : 'cursor-pointer border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700'
        }`}
      >
        {t('meetings.uploadDialog.browseFile')}
      </label>

      <span
        title={selectedFileName || undefined}
        className="min-w-0 flex-1 truncate text-center text-sm text-stone-500 dark:text-stone-400"
      >
        <span className="block truncate">{selectedFileName}</span>
      </span>
    </div>
  )
}
