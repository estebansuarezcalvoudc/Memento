import type { ReactNode } from 'react'

import { useDelayedDisplay } from '../../hooks/useDelayedDisplay'
import { useSidebarStore } from '../../stores/sidebarStore'

interface SidebarButtonProps {
  svg: ReactNode
  text: string
  className?: string
}

export default function SidebarButton({
  svg,
  text,
  className = '',
  ...props
}: SidebarButtonProps) {
  const isSidebarOpen = useSidebarStore(state => state.isSidebarOpen)
  const textRef = useDelayedDisplay<HTMLSpanElement>(isSidebarOpen, 'inline')

  return (
    <button
      className={`${isSidebarOpen ? 'flex w-full items-center' : 'w-9'} cursor-pointer rounded-xl py-2 ${className} ${isSidebarOpen && 'gap-2'} text-stone-700 hover:bg-stone-200`}
      {...props}
    >
      <div className="ml-1.5">{svg}</div>
      {isSidebarOpen && (
        <span
          ref={textRef}
          className="font-ubuntu ml-1.5 animate-[fadeInText_300ms_ease-out_50ms_forwards] text-left text-sm opacity-0"
        >
          {text}
        </span>
      )}
    </button>
  )
}
