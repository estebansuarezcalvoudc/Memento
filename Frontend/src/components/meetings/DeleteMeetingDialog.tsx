import { useTranslation } from 'react-i18next'

import { useDeleteMeeting } from '../../api/queries/useMeetingsQueries'
import type { Meeting } from '../../types/meetings'
import DangerButton from '../ui/buttons/DangerButton'
import SecondaryButton from '../ui/buttons/SecondaryButton'
import type { DialogHandler } from '../ui/layout/Dialog'
import Dialog from '../ui/layout/Dialog'

interface DeleteMeetingDialogProps {
  dialogRef: React.Ref<DialogHandler>
  meeting: Meeting
}

export default function DeleteMeetingDialog({
  dialogRef,
  meeting,
}: DeleteMeetingDialogProps) {
  const { mutate: deleteMeeting, isPending } = useDeleteMeeting()
  const { t } = useTranslation()

  return (
    <Dialog dialogRef={dialogRef} size="sm" showCloseButton={false}>
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-1 text-center">
          <span className="font-ubuntu text-lg">
            {t('meetings.deleteDialog.confirmMessage')}
          </span>
          <div className="font-ubuntu flex gap-4 text-base">
            <span className="dark:text-stone-100">{meeting.title}</span>
            <span className="dark:text-stone-400">-</span>
            <span className="dark:text-stone-400">{meeting.date}</span>
          </div>

          <div className="flex gap-x-2.5">
            <SecondaryButton onClick={() => dialogRef.current?.close()} />
            <DangerButton
              onClick={() => deleteMeeting(meeting.id)}
              disabled={isPending}
            >
              {t('settings.buttons.delete')}
            </DangerButton>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
