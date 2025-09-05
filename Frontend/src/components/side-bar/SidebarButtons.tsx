import {
  meetingsImage,
  newChatImage,
  uploadMeetingsImage,
} from '../../assets/buttonsImages'
import Button from './Button'

export default function SidebarButtons() {
  const buttons = [
    { image: newChatImage, text: 'New Chat' },
    { image: meetingsImage, text: 'My Meetings' },
    { image: uploadMeetingsImage, text: 'Upload Meetings' },
  ]

  return (
    <ul className="flex-shrink-0">
      {buttons.map(button => (
        <li key={button.text}>
          <Button svg={button.image} text={button.text} />
        </li>
      ))}
    </ul>
  )
}
