import type { ReactNode } from 'react'

import { useStore } from '../../store/store'

interface ButtonProps {
  svg: ReactNode
  text: string
  textColor?: string // Debe ser la clase completa, ej: 'text-red-500'
  hoverColor?: string // Debe ser la clase completa, ej: 'hover:bg-red-200'
  className?: string
}

export default function Button({
  svg,
  text,
  textColor = 'text-stone-700',
  hoverColor = 'hover:bg-stone-200',
  className = '',
  ...props
}: ButtonProps) {
  const isSideBarOpen = useStore(state => state.isSideBarOpen)

  const classes = `w-full ${textColor} ${hoverColor} rounded-xl py-2 ${isSideBarOpen && 'px-2'} flex ${isSideBarOpen ? 'place-content-left' : 'place-content-center'} gap-2 cursor-pointer ${className}`

  return (
    <button className={classes} {...props}>
      {svg}
      {isSideBarOpen && (
        <span className="font-ubuntu ml-1.5 truncate text-left text-sm">
          {text}
        </span>
      )}
    </button>
  )
}
