import { Section } from './sections/Section'

interface SettingsSectionButtonProps {
  label: Section
  isSelected: boolean
  onClick: () => void
}

export default function SettingsSectionButton({
  label,
  isSelected,
  onClick,
}: SettingsSectionButtonProps) {
  return (
    <button
      className={`font-ubuntu w-full cursor-pointer rounded-xl px-3 py-1.5 text-left text-base transition-colors hover:bg-stone-200 hover:text-stone-800 dark:hover:bg-stone-700 dark:hover:text-stone-100 ${
        isSelected
          ? 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100'
          : 'text-stone-600 dark:text-stone-400'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
