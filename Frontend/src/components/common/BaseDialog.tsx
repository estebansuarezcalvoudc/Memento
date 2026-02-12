import { useImperativeHandle, useRef } from 'react'
import { createPortal } from 'react-dom'

import { closeImage } from '../../assets/buttonsImages'

export interface DialogHandler {
  open: () => void
  close: () => void
}

interface BaseDialogProps {
  dialogRef: React.Ref<DialogHandler>
  title?: string
  ariaLabelledBy: string
  ariaLabel?: string
  children: React.ReactNode
}

export default function BaseDialog({
  dialogRef,
  title,
  ariaLabelledBy,
  ariaLabel = 'close-dialog',
  children,
}: BaseDialogProps) {
  const innerRef = useRef<HTMLDialogElement>(null)

  useImperativeHandle(dialogRef, () => ({
    open: () => innerRef.current?.showModal(),
    close: () => innerRef.current?.close(),
  }))

  return createPortal(
    <dialog
      ref={innerRef}
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      className="fixed top-1/2 left-1/2 z-[9990] h-[80vh] max-h-[90vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault()
          innerRef.current?.close()
        }
      }}
    >
      <button
        className="absolute top-6 right-6 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl p-1 text-stone-400 hover:bg-stone-200"
        onClick={() => innerRef.current?.close()}
        aria-label={ariaLabel}
      >
        {closeImage}
      </button>

      {title && (
        <div className="px-4 pt-5 pb-1">
          <h2
            id={ariaLabelledBy}
            className="font-dongle text-center text-5xl text-stone-700"
          >
            {title}
          </h2>
        </div>
      )}

      <div className="h-full">{children}</div>
    </dialog>,
    document.getElementById('modal-portal') as HTMLElement,
  )
}
