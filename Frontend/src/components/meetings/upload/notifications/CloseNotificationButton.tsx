import { closeImage } from '../../../../assets/buttonsImages'

export default function CloseNotificationButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="ml-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg hover:bg-black/10"
      aria-label="Close notification"
    >
      <div className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{closeImage}</div>
    </button>
  )
}
