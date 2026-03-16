import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import {
  meetingsImage,
  newChatImage,
  uploadMeetingsImage,
} from '../../../../assets/buttonsImages'
import UploadMeetingsDialog from '../../../meetings/upload/UploadMeetingsDialog'
import type { DialogHandler } from '../../../ui/layout/Dialog'
import { SidebarButton } from './SidebarButton'

export default function SidebarButtons() {
  const { t } = useTranslation()
  const dialogRef = useRef<DialogHandler>(null)

  const buttons = [
    {
      image: newChatImage,
      text: t('sidebar.newChat'),
      link: 'chats',
      end: true,
    },
    {
      image: meetingsImage,
      text: t('sidebar.myMeetings'),
      link: 'meetings',
      end: false,
    },
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
            end={button.end}
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
