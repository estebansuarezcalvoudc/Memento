import { useRef } from 'react'

import {
  meetingsImage,
  newChatImage,
  uploadMeetingsImage,
} from '../../../assets/buttonsImages'
import UploadFilesDialog, {
  type UploadFilesDialogHandler,
} from '../../upload-files/UploadFilesDialog'
import SidebarButton from '../navigation/SidebarButton'

export default function SidebarButtons() {
  const dialogRef = useRef<UploadFilesDialogHandler>(null)

  const buttons = [
    { image: newChatImage, text: 'New Chat', link: 'new-chat' },
    { image: meetingsImage, text: 'My Meetings', link: '' },
    { image: uploadMeetingsImage, text: 'Upload Meetings', link: '' },
  ]

  return (
    <ul className="flex-shrink-0">
      {buttons.map(button => (
        <li key={button.text}>
          <SidebarButton
            svg={button.image}
            text={button.text}
            to={button.link}
          />
        </li>
      ))}

      <button
        className="text-stone-800 cursor-pointer"
        onClick={() => dialogRef.current?.open()}
      >
        show dialog
      </button>

      <UploadFilesDialog dialogRef={dialogRef} />
    </ul>
  )
}
