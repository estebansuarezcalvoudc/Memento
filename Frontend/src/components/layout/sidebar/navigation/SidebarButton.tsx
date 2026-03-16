import type { ReactNode } from 'react'
import { NavLink, type NavLinkProps } from 'react-router-dom'

import { useDelayedDisplay } from '../../../../hooks/useDelayedDisplay'
import { useIsSidebarOpen } from '../../../../stores/sidebarStore'

interface BaseProps {
  svg: ReactNode
  text: string
  className?: string
}

interface SidebarButtonProps extends BaseProps {
  type: 'button'
  onClick: () => void
}

interface SidebarLinkProps extends BaseProps {
  type: 'link'
  to: NavLinkProps['to']
  end?: boolean
}

type SidebarItemProps = SidebarButtonProps | SidebarLinkProps

export function SidebarButton(props: SidebarItemProps) {
  const isSidebarOpen = useIsSidebarOpen()
  const commonClasses = `flex w-full cursor-pointer items-center justify-start rounded-xl py-2 ${props.className || ''} text-stone-700 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-700`

  if (props.type === 'button') {
    return (
      <button onClick={props.onClick} className={commonClasses}>
        <SidebarItemContent isSidebarOpen={isSidebarOpen} {...props} />
      </button>
    )
  }

  return (
    <NavLink
      to={props.to}
      end={props.end}
      className={({ isActive }) =>
        `${commonClasses} ${isActive ? 'bg-stone-200 dark:bg-stone-700' : ''}`
      }
    >
      <SidebarItemContent isSidebarOpen={isSidebarOpen} {...props} />
    </NavLink>
  )
}

interface SidebarItemContentProps {
  svg: ReactNode
  text: string
  isSidebarOpen: boolean
}

function SidebarItemContent(props: SidebarItemContentProps) {
  const textRef = useDelayedDisplay<HTMLSpanElement>(
    props.isSidebarOpen,
    'inline',
  )

  return (
    <>
      <div className="flex h-6 w-9 shrink-0 items-center justify-center">
        {props.svg}
      </div>
      {props.isSidebarOpen && (
        <span
          ref={textRef}
          className="font-ubuntu animate-[fadeInText_300ms_ease-out_50ms_forwards] text-left text-base opacity-0"
        >
          {props.text}
        </span>
      )}
    </>
  )
}
