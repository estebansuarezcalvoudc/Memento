import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

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
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isSideBarOpen && textRef.current) {
      // Initially hide the element completely (no layout impact)
      textRef.current.style.display = 'none'

      // After a delay, show it and start the animation
      const timer = setTimeout(() => {
        if (textRef.current) {
          textRef.current.style.display = 'inline'
        }
      }, 100) // Delay of 100ms

      return () => clearTimeout(timer)
    }
  }, [isSideBarOpen])

  // TODO mejorar cómo cambian los estilos al abrir y cerrar la barra lateral
  const classes = `${isSideBarOpen ? 'flex items-center w-full' : 'w-9'} ${textColor} ${hoverColor} rounded-xl py-2 cursor-pointer ${className} ${isSideBarOpen ? 'gap-2' : ''}`

  return (
    <button className={classes} {...props}>
      <div className="ml-1.5">{svg}</div>
      {isSideBarOpen && (
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
