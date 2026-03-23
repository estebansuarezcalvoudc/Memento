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
        className="h-4 w-4"
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(providerName)}
      />
      <SubSectionTitle title={title} />
    </label>
  )
}
