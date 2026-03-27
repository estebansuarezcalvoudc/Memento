import { useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { createPortal } from 'react-dom'

import { closeImage } from '../../../assets/buttonsImages'

export interface DialogHandler {
  open: () => void
  close: () => void
}

interface DialogProps {
  dialogRef: React.Ref<DialogHandler>
  children: React.ReactNode
  size?: 'sm' | 'xl'
  showCloseButton?: boolean
}

export default function Dialog({
  dialogRef,
  children,
  size = 'xl',
  showCloseButton = true,
}: DialogProps) {
  const innerRef = useRef<HTMLDialogElement>(null)
  const previousBodyOverflowRef = useRef('')
  const isBodyScrollLockedRef = useRef(false)
  const dialogSizeClassName =
    size === 'sm'
      ? 'h-[20vh] w-[40vh]'
      : 'h-[80vh] max-h-[90vh] w-[90vw] max-w-4xl'

  const lockBodyScroll = () => {
    if (isBodyScrollLockedRef.current) {
      return
    }

    previousBodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    isBodyScrollLockedRef.current = true
  }

  const unlockBodyScroll = useCallback(() => {
    if (!isBodyScrollLockedRef.current) {
      return
    }

    document.body.style.overflow = previousBodyOverflowRef.current
    isBodyScrollLockedRef.current = false
  }, [])

  const openDialog = () => {
    innerRef.current?.showModal()
    lockBodyScroll()
  }

  const closeDialog = () => {
    innerRef.current?.close()
    unlockBodyScroll()
  }

  useImperativeHandle(dialogRef, () => ({
    open: openDialog,
    close: closeDialog,
  }))

  useEffect(() => {
    return () => {
      unlockBodyScroll()
    }
  }, [unlockBodyScroll])

  return createPortal(
    <dialog
      ref={innerRef}
      aria-modal="true"
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white p-0 backdrop-blur-xl backdrop:backdrop-blur-[1px] dark:bg-stone-700 ${dialogSizeClassName}`}
      onClose={unlockBodyScroll}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault()
          closeDialog()
        }
      }}
    >
      {showCloseButton ? (
        <button
          className="absolute top-4 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl p-1 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
          onClick={closeDialog}
          aria-label="close-dialog"
        >
          {closeImage}
        </button>
      ) : null}

      {children}
    </dialog>,
    document.getElementById('dialog') as HTMLElement,
  )
}
