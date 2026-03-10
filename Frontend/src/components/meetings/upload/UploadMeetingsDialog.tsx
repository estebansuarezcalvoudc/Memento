import Dialog, { type DialogHandler } from '../../common/Dialog'
import UploadMeetingsForm from './UploadMeetingsForm'

interface UploadMeetingsDialogProps {
  dialogRef: React.Ref<DialogHandler>
  onClose: () => void
}

export default function UploadMeetingsDialog({
  dialogRef,
  onClose,
}: UploadMeetingsDialogProps) {
  return (
    <Dialog dialogRef={dialogRef}>
      <div className="absolute inset-0 flex flex-col pt-5">
        <div className="shrink-0 px-4">
          <h2
            id="upload-files-dialog-title"
            className="font-ubuntu text-center text-3xl text-stone-800 dark:text-stone-100"
          >
            Upload Files
          </h2>
          <hr className="mt-4 mb-2 border-t border-stone-500 opacity-100 transition-opacity duration-300 dark:border-stone-600" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-8">
          <UploadMeetingsForm handleCloseDialog={onClose} />
        </div>
      </div>
    </Dialog>
  )
}
