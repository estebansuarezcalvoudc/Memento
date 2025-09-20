import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

import { useDelayedDisplay } from '../../../hooks/side-bar/useDelayedDisplay'
import { useIsSidebarOpen } from '../../../stores/sidebarStore'

interface SidebarButtonProps {
  svg: ReactNode
  text: string
  to: string
  className?: string
}

export default function SidebarLink({
  svg,
  text,
  to,
  className = '',
  ...props
}: SidebarButtonProps) {
  const isSidebarOpen = useIsSidebarOpen()
  const textRef = useDelayedDisplay<HTMLSpanElement>(isSidebarOpen, 'inline')

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        ` ${isSidebarOpen ? 'flex w-full items-center' : 'w-9'} h-14 cursor-pointer rounded-xl py-2 ${className || ''} ${isSidebarOpen ? 'gap-2' : ''} text-stone-700 hover:bg-stone-200 ${isActive ? 'bg-stone-200' : ''} `
      }
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
    </NavLink>
  )
}
