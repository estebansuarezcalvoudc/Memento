import { useTranslation } from 'react-i18next'

import Dialog, { type DialogHandler } from '../../ui/layout/Dialog'
import SectionHeader from '../../ui/layout/SectionHeader'
import UploadMeetingsForm from './UploadMeetingsForm'

interface UploadMeetingsDialogProps {
  dialogRef: React.Ref<DialogHandler>
}

export default function UploadMeetingsDialog({
  dialogRef,
}: UploadMeetingsDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog dialogRef={dialogRef}>
      <div className="absolute inset-0 flex flex-col">
        <div className="shrink-0 px-4 pt-4">
          <SectionHeader
            title={t('meetings.uploadDialog.title')}
            titleId="upload-files-dialog-title"
            centered
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-5 lg:px-8">
          <UploadMeetingsForm />
        </div>
      </div>
    </Dialog>
  )
}
