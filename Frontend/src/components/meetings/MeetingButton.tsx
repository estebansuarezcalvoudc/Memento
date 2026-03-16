interface MeetingButtonProps {
  image: React.ReactNode
  onClick: () => void
  bgColor: string
  textColor: string
  disabled: boolean
  ariaLabel?: string
}

export default function MeetingButton({
  image,
  onClick,
  bgColor,
  textColor,
  disabled,
  ariaLabel,
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
