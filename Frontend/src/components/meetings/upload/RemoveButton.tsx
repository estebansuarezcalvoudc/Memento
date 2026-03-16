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
      bgColor="hover:bg-red-300"
      textColor="hover:text-red-800 text-stone-500"
      disabled={disabled}
    />
  )
}
