import { useEffect, useRef, useState } from 'react'

interface TooltipProps {
  message: string | null
}

export default function Tooltip({ message }: TooltipProps) {
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!message) {
      return
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setVisibleMessage(message)
    timerRef.current = setTimeout(() => setVisibleMessage(null), 3000)
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [message])

  if (!visibleMessage) {
    return null
  }

  return (
    <div className="font-ubuntu absolute top-full right-0 z-20 mt-2 w-max max-w-52 rounded-lg bg-stone-800 px-3 py-1.5 text-center text-xs text-white shadow-lg">
      {visibleMessage}
      <div className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-stone-800" />
    </div>
  )
}
