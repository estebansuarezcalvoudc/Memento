import { useCallback } from 'react'

import Dialog, { type DialogHandler } from '../../common/Dialog'
import UploadMeetingsForm from './UploadMeetingsForm'

interface UploadMeetingsDialogProps {
  dialogRef: React.Ref<DialogHandler>
}

export default function UploadMeetingsDialog({
  dialogRef,
}: UploadMeetingsDialogProps) {
  const handleClose = useCallback(() => {
    ; (dialogRef as React.RefObject<DialogHandler>).current?.close()
  }, [dialogRef])

  return (
    <Dialog dialogRef={dialogRef}>
      <div className="absolute inset-0 flex flex-col px-4 pt-5">
        <div className="mb-1 flex shrink-0 items-center justify-between">
          <div className="w-8" />
          <h2
            id="upload-files-dialog-title"
            className="font-dongle flex-1 text-center text-5xl text-stone-700"
          >
            Upload Files
          </h2>
          <div className="w-8" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <UploadMeetingsForm handleCloseDialog={handleClose} />
        </div>
      </div>
    </Dialog>
  )
}
