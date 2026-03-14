import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  meetingsImage,
  newChatImage,
  uploadMeetingsImage,
} from '../../../../assets/buttonsImages'
import type { DialogHandler } from '../../../common/Dialog'
import UploadMeetingsDialog from '../../../meetings/upload/UploadMeetingsDialog'
import { SidebarButton } from './SidebarButton'

export default function SidebarButtons() {
  const { t } = useTranslation()
  const dialogRef = useRef<DialogHandler>(null)

  const buttons = [
    { image: newChatImage, text: t('sidebar.newChat'), link: 'chats' },
    { image: meetingsImage, text: t('sidebar.myMeetings'), link: 'meetings' },
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
          text={t('sidebar.uploadMeetings')}
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
