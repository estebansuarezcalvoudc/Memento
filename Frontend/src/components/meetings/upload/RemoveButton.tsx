import { removeImage } from '../../../assets/buttonsImages'
import MeetingButton from '../MeetingButton'

interface RemoveButtonProps {
  onClick: () => void
  disabled: boolean
}

export default function RemoveButton({ onClick, disabled }: RemoveButtonProps) {
  return (
    <MeetingButton
      image={removeImage}
      onClick={onClick}
      bgColor="hover:bg-red-100"
      textColor="hover:text-red-600 text-stone-500"
      disabled={disabled}
    />
  )
}
