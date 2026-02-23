import { useRef } from 'react'

import {
  meetingsImage,
  newChatImage,
  uploadMeetingsImage,
} from '../../../../assets/buttonsImages'
import UploadMeetingsDialog from '../../../meetings/upload/UploadMeetingsDialog'
import { SidebarButton } from './SidebarButton'
import type { DialogHandler } from '../../../common/Dialog'

export default function SidebarButtons() {
  const dialogRef = useRef<DialogHandler>(null)

  const buttons = [
    { image: newChatImage, text: 'New Chat', link: 'new-chat' },
    { image: meetingsImage, text: 'My Meetings', link: 'meetings' },
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

      <li>
        <SidebarButton
          type="button"
          svg={uploadMeetingsImage}
          text="Upload Meetings"
          onClick={() => dialogRef.current?.open()}
        />

        <UploadMeetingsDialog
            dialogRef={dialogRef}
            onClose={() => dialogRef.current?.close()}
          />
      </li>
    </ul>
  )
}
