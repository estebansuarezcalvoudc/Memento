import { useRef } from 'react'

import {
  meetingsImage,
  newChatImage,
  uploadMeetingsImage,
} from '../../../assets/buttonsImages'
import UploadFilesDialog, {
  type UploadFilesDialogHandler,
} from '../../upload-files/UploadFilesDialog'
import { SidebarButton } from './SidebarButton'

export default function SidebarButtons() {
  const dialogRef = useRef<UploadFilesDialogHandler>(null)

  const buttons = [
    { image: newChatImage, text: 'New Chat', link: 'new-chat' },
    { image: meetingsImage, text: 'My Meetings', link: '' },
  ]

  return (
    <ul className="flex-shrink-0">
      {buttons.map(button => (
        <li key={button.text}>
          <SidebarButton
            type="link"
            svg={button.image}
            text={button.text}
            to={button.link}
          />
        </li>
      ))}

      <SidebarButton
        type="button"
        svg={uploadMeetingsImage}
        text="Upload Meetings"
        onClick={() => dialogRef.current?.open()}
      />

      <UploadFilesDialog dialogRef={dialogRef} />
    </ul>
  )
}
