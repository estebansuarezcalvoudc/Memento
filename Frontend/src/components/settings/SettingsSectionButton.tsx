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
      className={`font-ubuntu w-full cursor-pointer rounded-xl px-3 py-1.5 text-left text-base transition-colors hover:bg-stone-300 hover:text-stone-800 ${isSelected ? 'bg-stone-300 text-stone-800' : 'text-stone-600'
        }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
