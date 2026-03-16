import { useImperativeHandle, useRef } from 'react'
import { createPortal } from 'react-dom'

import { closeImage } from '../../../assets/buttonsImages'

export interface DialogHandler {
  open: () => void
  close: () => void
}

interface DialogProps {
  dialogRef: React.Ref<DialogHandler>
  children: React.ReactNode
}

export default function Dialog({ dialogRef, children }: DialogProps) {
  const innerRef = useRef<HTMLDialogElement>(null)

  useImperativeHandle(dialogRef, () => ({
    open: () => innerRef.current?.showModal(),
    close: () => innerRef.current?.close(),
  }))

  return createPortal(
    <dialog
      ref={innerRef}
      aria-modal="true"
      className="fixed top-1/2 left-1/2 z-[9990] h-[80vh] max-h-[90vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white p-0 backdrop-blur-xl backdrop:backdrop-blur-[1px] dark:bg-stone-800"
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault()
          innerRef.current?.close()
        }
      }}
    >
      <button
        className="absolute top-4 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl p-1 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
        onClick={() => innerRef.current?.close()}
        aria-label="close-dialog"
      >
        {closeImage}
      </button>

      {children}
    </dialog>,
    document.getElementById('dialog') as HTMLElement,
  )
}
