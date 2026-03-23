import SubSectionTitle from '../SubSectionTitle'

interface ProviderSelectorTitleProps {
  title: string
  providerName: string
  checked: boolean
  disabled?: boolean
  onSelect: (providerName: string) => void
}

export default function ProviderSelectorTitle({
  title,
  providerName,
  checked,
  disabled = false,
  onSelect,
}: ProviderSelectorTitleProps) {
  return (
    <label className="mb-2 flex items-center gap-2">
      <input
        type="radio"
        name="transcription-provider"
        className="h-4 w-4 appearance-none rounded-full border border-stone-400 bg-stone-100 transition-colors checked:border-lime-500 checked:bg-lime-500 focus-visible:ring-2 focus-visible:ring-lime-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-500 dark:bg-stone-700"
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(providerName)}
      />
      <SubSectionTitle title={title} />
    </label>
  )
}
