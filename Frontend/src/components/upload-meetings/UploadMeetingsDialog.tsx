import BaseDialog, { type DialogHandler } from '../common/BaseDialog'
import UploadMeetingsForm from './UploadMeetingsForm'

export type UploadMeetingsDialogHandler = DialogHandler

interface UploadMeetingsDialogProps {
  dialogRef: React.Ref<UploadMeetingsDialogHandler>
}

export default function UploadMeetingsDialog({
  dialogRef,
}: UploadMeetingsDialogProps) {
  const handleClose = () => {
    if (typeof dialogRef === 'function') {
      return
    }
    dialogRef?.current?.close()
  }

  return (
    <BaseDialog
      dialogRef={dialogRef}
      title="Upload Files"
      ariaLabelledBy="upload-files-dialog-title"
      ariaLabel="close-upload-meetings-dialog"
    >
      <UploadMeetingsForm handleCloseDialog={handleClose} />
    </BaseDialog>
  )
}
