import { useImperativeHandle, useRef } from 'react'

export interface UploadFilesDialogHandler {
  open: () => void
  close: () => void
}

interface UploadFilesDialogProps {
  dialogRef: React.RefObject<UploadFilesDialogHandler>
}

export default function UploadFilesDialog({ dialogRef }: UploadFilesDialogProps) {
  const innerRef = useRef<HTMLDialogElement>(null)

  useImperativeHandle(dialogRef, () => ({
    open: () => innerRef.current?.showModal(),
    close: () => innerRef.current?.close(),
  }))
  return (
    <dialog ref={innerRef}>
      <h2>Upload Files</h2>
    </dialog>
  )
}
