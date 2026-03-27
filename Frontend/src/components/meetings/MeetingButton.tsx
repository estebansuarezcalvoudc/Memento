interface MeetingButtonProps {
  image: React.ReactNode
  onClick: () => void
  bgColor: string
  textColor: string
  ariaLabel?: string
  disabled?: boolean
}

export default function MeetingButton({
  image,
  onClick,
  bgColor,
  textColor,
  ariaLabel,
  disabled,
}: MeetingButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 ${bgColor} ${textColor} disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {image}
    </button>
  )
}
